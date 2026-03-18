/*
  content_loader.js
  -----------------
  This file loads site content from a CSV metadata file.

*/

(function () {
  "use strict";

  // Public API (attached to window so other scripts/pages can use it)
  window.CWRContent = {
    items: [],
    isLoaded: false,

    // Load CSV -> parse -> store in memory
    load: loadContent,

    // Helper: get items for a specific section (projects, publications, presentations, links)
    getBySection: getBySection,

    // Helper: homepage highlights (highlight == TRUE) limited to 6 items
    getHighlights: getHighlights,

    // Helper: for rendering
    getLinkUrl: getLinkUrl,
    createCardElement: createCardElement,
    renderCards: renderCards
  };

  // =====================================
  // STEP 1: Load the CSV file
  // =====================================

  function loadContent(callback) {
    // Prevent multiple loads.
    if (window.CWRContent.isLoaded) {
      if (callback) {
        callback(window.CWRContent.items);
      }
      return;
    }

    var csvPath = "data/content_metadata.csv";

    // Try to fetch the CSV first.
    // This works when the site is served from a web server.
    if (window.fetch) {
      fetch(csvPath)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("CSV fetch failed: " + response.status);
          }
          return response.text();
        })
        .then(function (csvText) {
          finishLoad(csvText, callback);
        })
        .catch(function () {
          // Fall back if local file fetch isn't allowed.
          finishLoad(getEmbeddedCsvFallback(), callback);
        });

      return;
    }

    // Very old browsers: no fetch.
    finishLoad(getEmbeddedCsvFallback(), callback);
  }

  function finishLoad(csvText, callback) {
    var items = parseCsvToObjects(csvText);

    // Sort once at load time.
    items = sortItems(items);

    window.CWRContent.items = items;
    window.CWRContent.isLoaded = true;

    if (callback) {
      callback(items);
    }
  }

  // =====================================
  // STEP 1b: CSV parsing (simple manual parser)
  // =====================================

  function parseCsvToObjects(csvText) {
    // Normalize line endings and remove empty lines.
    var lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    // Remove leading/trailing blank lines.
    lines = lines.filter(function (line) {
      return line.trim() !== "";
    });

    if (lines.length < 2) {
      return [];
    }

    var headers = parseCsvLine(lines[0]);
    var results = [];

    for (var i = 1; i < lines.length; i++) {
      var row = parseCsvLine(lines[i]);
      var obj = {};

      for (var h = 0; h < headers.length; h++) {
        obj[headers[h]] = row[h] !== undefined ? row[h] : "";
      }

      // Normalize a few fields we care about
      obj.year = toNumberOrNull(obj.year);
      obj.display_order = toNumberOrNull(obj.display_order);
      obj.highlight = parseBoolean(obj.highlight);

      results.push(obj);
    }

    return results;
  }

  function parseCsvLine(line) {
    // Handles commas and simple quoted values.
    // This is not a "perfect" CSV parser, but it covers normal CSV use cases.

    var values = [];
    var current = "";
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      var next = i + 1 < line.length ? line.charAt(i + 1) : "";

      if (ch === '"') {
        // If we're inside quotes and the next char is also a quote,
        // that means an escaped quote. Example: "" -> "
        if (inQuotes && next === '"') {
          current += '"';
          i++;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += ch;
    }

    values.push(current);

    // Trim whitespace from each value (but not inside quotes, because we already removed quotes)
    for (var v = 0; v < values.length; v++) {
      values[v] = values[v].trim();
    }

    return values;
  }

  function parseBoolean(value) {
    /*
      Boolean parsing for CSV fields
      ------------------------------
      The CSV uses TRUE/FALSE, but we accept a few common variants
      to make the site more forgiving (and easier to maintain).
    */

    if (value === null || value === undefined) {
      return false;
    }

    var s = String(value).trim().toUpperCase();

    return s === "TRUE" || s === "YES" || s === "1";
  }

  function toNumberOrNull(value) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number") {
      return value;
    }

    var s = String(value).trim();
    if (s === "") {
      return null;
    }

    var n = Number(s);
    if (isNaN(n)) {
      return null;
    }

    return n;
  }

  // =====================================
  // STEP 5: Sorting (display_order, then year)
  // =====================================

  function sortItems(items) {
    // Sort: display_order (missing -> big number), then year (missing -> 0)
    // Note: year sorting is descending so newest items appear first when order ties.
    return items.slice().sort(function (a, b) {
      var aOrder = a.display_order === null ? 999999 : a.display_order;
      var bOrder = b.display_order === null ? 999999 : b.display_order;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      var aYear = a.year === null ? 0 : a.year;
      var bYear = b.year === null ? 0 : b.year;

      return bYear - aYear;
    });
  }

  // =====================================
  // STEP 2 and 4: Filtering helpers
  // =====================================

  function getBySection(sectionName) {
    return window.CWRContent.items.filter(function (item) {
      return item.site_section === sectionName;
    });
  }

  function getHighlights(maxCount) {
    var limit = typeof maxCount === "number" ? maxCount : 6;

    var filtered = window.CWRContent.items.filter(function (item) {
      return item.highlight === true;
    });

    return filtered.slice(0, limit);
  }

  // =====================================
  // STEP 3: Link logic
  // =====================================

  function getLinkUrl(item) {
    // Link logic rules (from requirements)
    // - if link_type == "download"     => repo_relative_path
    // - if link_type == "external"     => external_url
    //
    // Our CSV also includes values like: researchgate, article, video, profile
    // Those are still external links, so we treat them like "external".

    var type = (item.link_type || "").trim().toLowerCase();

    if (type === "download") {
      return item.repo_relative_path || "";
    }

    // Treat these as external links too.
    if (
      type === "external" ||
      type === "researchgate" ||
      type === "article" ||
      type === "video" ||
      type === "profile"
    ) {
      return item.external_url || "";
    }

    // If link_type is "none" or blank, return empty.
    if (type === "none" || type === "") {
      return "";
    }

    // Fallback: prefer an external URL when present.
    if (item.external_url) {
      return item.external_url;
    }

    return item.repo_relative_path || "";
  }

  // =====================================
  // STEP 6: Card rendering
  // =====================================

  function createCardElement(item) {
    // Create an <article> card using existing CSS classes.
    var card = document.createElement("article");
    card.className = "card";

    // Title line: Title (Year)
    var title = document.createElement("h3");
    title.textContent = item.title || "(Untitled)";

    if (item.year) {
      var yearSpan = document.createElement("span");
      yearSpan.className = "meta";
      yearSpan.textContent = String(item.year);

      // Put year above title for readability.
      card.appendChild(yearSpan);
    }

    card.appendChild(title);

    // Description
    var desc = document.createElement("p");
    desc.textContent = item.short_description || "";
    card.appendChild(desc);

    // Button (only if we have a link)
    var url = getLinkUrl(item);

    if (url) {
      var button = document.createElement("a");
      button.className = "button";
      button.href = url;

      /*
        Link behavior
        -------------
        Per site request:
        - All links (downloads and external links) should open in a new tab.

        Note:
        - For security, we add rel="noopener noreferrer".
      */
      button.target = "_blank";
      button.rel = "noopener noreferrer";

      // Simple button text
      var type = (item.link_type || "").trim().toLowerCase();
      if (type === "download") {
        button.textContent = "Download";
      } else {
        button.textContent = "Open Link";
      }

      card.appendChild(button);
    } else {
      // If no link, show a small placeholder.
      var note = document.createElement("p");
      note.className = "placeholder-link";
      note.textContent = "Link coming soon →";
      card.appendChild(note);
    }

    return card;
  }

  function renderCards(container, items, options) {
    // options:
    // - scrollLayout: true => use horizontal scroll styling (adds scroll-card class)
    // - max: number => limit card count

    if (!container) {
      return;
    }

    // Clear existing content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var max = options && typeof options.max === "number" ? options.max : null;
    var useScrollCards = options && options.scrollLayout === true;

    for (var i = 0; i < items.length; i++) {
      if (max !== null && i >= max) {
        break;
      }

      var card = createCardElement(items[i]);

      if (useScrollCards) {
        // Use existing horizontal scroll card class.
        card.classList.add("scroll-card");
      }

      container.appendChild(card);
    }
  }

  // =====================================
  // Fallback CSV (keeps the site working from file://)
  // =====================================

  function getEmbeddedCsvFallback() {
    /*
      Local-file fallback
      -------------------
      If the site is opened from file://, most browsers block fetch() of local files.

      To keep the site fully usable without a local web server, we include the CSV
      content here as a fallback.

      IMPORTANT:
      - When you host the site (GitHub Pages, any web server), the live CSV file
        at data/content_metadata.csv will be used instead.
      - If you edit the CSV file and want local-file mode to match EXACTLY, you
        should also update this fallback.

      If you don’t want to maintain two copies long-term, the best solution is to
      view the site using a tiny local server (Python's http.server).
    */

    return (
      "content_id,item_type,site_section,title,year,short_description,highlight,display_order,link_type,external_url,current_filename,repo_relative_path,slug,source_basis,notes\n" +
      "CWR-001,project,projects,Cross Israel Highway Stormwater Quality Study - Phase IV Final Report,2004,\"Major highway runoff study evaluating stormwater quality, pollutant loadings, and the effect of sweeping practices near the Hayarkon Springs well field.\",TRUE,5,download,,CIH Report-Phase IV Final.pdf,reports/cross-israel-highway-stormwater-quality-study-phase-iv-2004.pdf,cross-israel-highway-stormwater-quality-study,uploaded report + CV,Can be linked both from Projects and Publications.\n" +
      "CWR-002,project,projects,Jackson Great Lakes Tributary Pilot Study,2001,Pilot study quantifying the impact of catch basin cleaning and street sweeping on storm water quality for a Great Lakes tributary using SIMPTM.,TRUE,1,download,,Michigan Street Sweeping Study (1).pdf,reports/jackson-great-lakes-tributary-pilot-study-2001.pdf,jackson-great-lakes-tributary-pilot-study,uploaded report + CV,Good candidate for homepage highlight and direct PDF link.\n" +
      "CWR-003,project,projects,Livonia Storm Sewer Maintenance Study,2001,City of Livonia study evaluating catch basin cleaning and street sweeping with SIMPTM to reduce pollutant loadings to the Rouge River.,TRUE,2,download,,cover.pdf + FINAL_RPT (1).pdf,reports/livonia-storm-sewer-maintenance-study-2001.pdf,livonia-storm-sewer-maintenance-study,uploaded report + CV,Merge cover.pdf and FINAL_RPT (1).pdf into one PDF before linking.\n" +
      "CWR-004,project,projects,San Juan County Street Dirt Collection and Analysis,,\"Street dirt collection and analysis for ferry docking and departure facilities, showing significant stormwater pollution discharges and supporting sweeper acquisition.\",TRUE,4,none,,,,san-juan-county-street-dirt-collection-and-analysis,CV only,No uploaded PDF yet. Good featured project summary item.\n" +
      "CWR-005,project,projects,Seattle Street Sweeping Program Pilot Study,,Year-long Seattle Public Utilities pilot study using frequent sweeping and street dirt data collection to assess pollutant reduction.,TRUE,3,none,,,,seattle-street-sweeping-program-pilot-study,CV only,No uploaded PDF yet. Leave as project page / summary only for now.\n" +
      "CWR-006,project,projects,Street Cleaner Pick-Up Performance Tests for the Elgin Sweeper Company,2008,Controlled street cleaner pickup performance testing across multiple sweeper models and particle size ranges.,FALSE,,download,,Elgin_Pick-up_Performance_Modified_Final.pdf,reports/elgin-street-cleaner-pickup-performance-tests-2008.pdf,elgin-street-cleaner-pickup-performance-tests,uploaded report + CV,Useful supporting technical report for sweeper performance discussions.\n" +
      "CWR-007,project,projects,Port of Seattle Stormwater Treatment BMP Evaluation,1997,Evaluation of high-efficiency pavement sweepers and conventional sediment-trapping catchbasins for marine terminal stormwater treatment.,FALSE,,download,,PortofSeattleSweepingStudy.pdf,reports/port-of-seattle-stormwater-treatment-bmp-evaluation-1997.pdf,port-of-seattle-stormwater-treatment-bmp-evaluation,uploaded report + CV,Historic but strong supporting project for source-control BMP effectiveness.\n" +
      "CWR-008,project,projects,Washoe County Urban Stormwater Management Program - Volume II,1982,Street particulate data collection and analyses supporting the Washoe County urban stormwater management program.,FALSE,,download,,Reno-Sparks WCOG Vol II Report.pdf,reports/washoe-county-urban-stormwater-management-program-volume-2-1982.pdf,washoe-county-urban-stormwater-management-program-volume-2,uploaded report + CV,Historic foundational work; strong archive item.\n" +
      "CWR-009,publication,publications,Street Sweeping: Clearly America’s First Line of Defense for Stormwater Pollution Abatement,2023,ResearchGate publication page for Roger Sutherland and Ranger Kidwell-Ross on sweeping as a first-line stormwater BMP.,TRUE,1,researchgate,https://www.researchgate.net/publication/380069609_Street_Sweeping_Clearly_America%27s_First_Line_of_Defense_for_Stormwater_Pollution_Abatement,, ,street-sweeping-clearly-americas-first-line-of-defense-for-stormwater-pollution-abatement,web,Useful companion link even though the exact title differs from the 2023 CSWA presentation title.\n" +
      "CWR-010,publication,publications,Street Dirt: A Better Way of Measuring BMP Effectiveness,2010,Street dirt chemistry and monitoring as a practical way to measure BMP effectiveness.,TRUE,2,article,https://www.worldsweeper.com/Newsletters/2010/March/index.html,, ,street-dirt-a-better-way-of-measuring-bmp-effectiveness,CV,\"Minton, G.R., and R.C. Sutherland, Stormwater, Vol. 11, No. 2, pp. 12-21, March/April 2010 | WorldSweeper article page found; direct publisher page was not identified.\"\n" +
      "CWR-011,publication,publications,Stormwater Quality Modeling of Cross Israel Highway Runoff,2006,Highway runoff modeling and pollutant reduction analysis using SIMPTM and related methods.,TRUE,3,researchgate,https://www.researchgate.net/publication/287852858_Stormwater_Quality_Modeling_of_Cross_Israel_Highway_Runoff,, ,stormwater-quality-modeling-of-cross-israel-highway-runoff,CV,\"Sutherland, R.C., G.R. Minton and U. Marinov, Intelligent Modeling of Urban Water Systems - Monograph 14, 2006\"\n" +
      "CWR-012,publication,publications,Street Sweeping: America’s Proven First Line of Defense for Stormwater Runoff Pollution Abatement,2020,ResearchGate publication page summarizing Florida study results and the role of sweeping in stormwater runoff pollution reduction.,FALSE,,researchgate,https://www.researchgate.net/publication/344955423_Street_Sweeping_America%27s_Proven_First_Line_of_Defense_for_Stormwater_Runoff_Pollution_Abatement,, ,street-sweeping-americas-proven-first-line-of-defense-for-stormwater-runoff-pollution-abatement,web,\"Not in the uploaded CV list, but aligns with the current site theme.\"\n" +
      "CWR-013,publication,publications,\"Cleaner Streets, Cleaner Water\",2013,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,cleaner-streets-cleaner-water,CV,\"J. Keating and edited by R. C. Sutherland, Stormwater, Vol 14 No. 4, pp. 46-53, June 2013\"\n" +
      "CWR-014,publication,publications,Street Sweeping 101: Using Street Sweepers to Improve Water and Air Quality,2011,Overview of street sweeping as a stormwater pollution abatement strategy and BMP.,FALSE,,none,,,,street-sweeping-101-using-street-sweepers-to-improve-water-and-air-quality,CV,\"Sutherland, R.C., Stormwater, Vol. 12, No. 1, pp. 20-30. January/February 2011\"\n" +
      "CWR-015,publication,publications,The Role Street Sweeping Must Play in Achieving Numeric Pollutant Limits,2011,Overview of street sweeping as a stormwater pollution abatement strategy and BMP.,FALSE,,none,,,,the-role-street-sweeping-must-play-in-achieving-numeric-pollutant-limits,CV,\"Sutherland, R.C., Stormwater, Vol 12 No. 8, pp. 8-13, Guest Editorial, November/December 2011\"\n" +
      "CWR-016,publication,publications,Real World Street Cleaner Pickup Performance Testing,2009,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,real-world-street-cleaner-pickup-performance-testing,CV,\"Sutherland, R.C., presented and published STORMCON 2009, Anaheim, California July 2009\"\n" +
      "CWR-017,publication,publications,Recent Street Sweeping Pilot Studies are Flawed,2009,Overview of street sweeping as a stormwater pollution abatement strategy and BMP.,FALSE,,none,,,,recent-street-sweeping-pilot-studies-are-flawed,CV,\"Sutherland R.C., APWA Reporter, Vol. 76, No. 9, pp. 50-53, September 2009\"\n" +
      "CWR-018,publication,publications,Urban Myths Associated with Street Cleaning,2009,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,urban-myths-associated-with-street-cleaning,CV,\"Sutherland, R.C., APWA International Public Works Congress & Exposition, Columbus, Ohio, September 2009\"\n" +
      "CWR-019,publication,publications,A Proposal for a New Research Direction,2008,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,researchgate,https://www.researchgate.net/publication/287851835_A_Proposal_for_a_New_Research_Direction,, ,a-proposal-for-a-new-research-direction,CV,\"CHI Publications, 2008\"\n" +
      "CWR-020,publication,publications,Street Cleaner Pick-up Performance Testing,2006,Street sweeper pickup performance testing under controlled or field conditions.,FALSE,,none,,,,street-cleaner-pick-up-performance-testing,CV,\"presented and published STORMCON 2006\"\n" +
      "CWR-021,publication,publications,Modeling the Water Quality Benefits of Pavement Cleaning on Cross Israel Highway Runoff,2005,Highway runoff modeling and pollutant reduction analysis using SIMPTM and related methods.,FALSE,,none,,,,modeling-the-water-quality-benefits-of-pavement-cleaning-on-cross-israel-highway-runoff,CV,\"presented and published STORMCON 2005\"\n" +
      "CWR-022,publication,publications,Monitoring Stormwater Pollutants from the Cross Israel Highway,2005,Highway runoff modeling and pollutant reduction analysis using SIMPTM and related methods.,FALSE,,none,,,,monitoring-stormwater-pollutants-from-the-cross-israel-highway,CV,\"presented and published STORMCON 2005\"\n" +
      "CWR-023,publication,publications,The Role of Street Cleaning in Stormwater Management,2004,ResearchGate publication page on the broader role of street cleaning in stormwater management.,FALSE,,researchgate,https://www.researchgate.net/publication/237272973_The_Role_of_Street_Cleaning_in_Stormwater_Management,, ,the-role-of-street-cleaning-in-stormwater-management,web,Good supporting publication for a background reading section.\n" +
      "CWR-024,publication,publications,\"SIMPTM Diagnosis, A Technique for Accurate Urban Runoff Load Estimation\",2003,\"SIMPTM modeling methods, diagnosis, or applications for urban runoff pollutant estimation.\",FALSE,,researchgate,https://www.researchgate.net/publication/294520703_SIMPTM_diagnosis,, ,simptm-diagnosis-a-technique-for-accurate-urban-runoff-load-estimation,CV,\"Water Environment & Technology, 2003\"\n" +
      "CWR-025,publication,publications,Stormwater Quality Modeling Improvements Needed for SWMM,2003,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,researchgate,https://www.researchgate.net/publication/242275179_Stormwater_Quality_Modeling_Improvements_Needed_for_SWMM,, ,stormwater-quality-modeling-improvements-needed-for-swmm,CV,\"CHI Publications, 2003\"\n" +
      "CWR-026,publication,publications,A Technique for Accurate Urban Runoff Load Estimation,2002,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,researchgate,https://www.researchgate.net/publication/242211935_A_TECHNIQUE_FOR_ACCURATE_URBAN_RUNOFF_LOAD_ESTIMATION,, ,a-technique-for-accurate-urban-runoff-load-estimation,CV,\"WEF Specialty Conference, 2002\"\n" +
      "CWR-027,publication,publications,Development of Accurate Urban Runoff Pollutant Loads for TMDL Analyses,2002,Project or paper tied to TMDL compliance and pollutant reduction through enhanced sweeping.,FALSE,,none,,,,development-of-accurate-urban-runoff-pollutant-loads-for-tmdl-analyses,CV,\"StormCon 2002\"\n" +
      "CWR-028,publication,publications,Quantifying the Optimum Urban Runoff Pollutant Load Reductions Associated with Various Street and Catchbasin Cleaning Practices,2002,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,researchgate,https://www.researchgate.net/publication/268596140_Quantifying_the_Optimum_Urban_Runoff_Pollutant_Load_Reductions_Associated_with_Various_Street_and_Catchbasin_Cleaning_Practices,, ,quantifying-the-optimum-urban-runoff-pollutant-load-reductions-associated-with-various-street-and-catchbasin-cleaning-practices,CV,\"ICUD 2002\"\n" +
      "CWR-029,publication,publications,Quantifying the Stormwater Pollution Reduction Benefits of Traditional Public Works Maintenance Practices,2002,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,researchgate,https://www.researchgate.net/publication/287851869_Quantifying_the_Stormwater_Pollutant_Reduction_Benefits_of_Traditional_Public_Works_Maintenance_Practices,, ,quantifying-the-stormwater-pollution-reduction-benefits-of-traditional-public-works-maintenance-practices,CV,\"Best Modeling Practices, 2002\"\n" +
      "CWR-030,publication,publications,Recent SCAQMD Test Ignores PM-10 Efficiency Issue,1999,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,recent-scaqmd-test-ignores-pm-10-efficiency-issue,CV,\"American Sweeper, 1999\"\n" +
      "CWR-031,publication,publications,High-Efficiency Sweeping as an Alternative to the Use of Wet Vaults for Stormwater Treatment,1998,Comparison of high-efficiency sweeping and structural stormwater treatment approaches.,FALSE,,researchgate,https://www.researchgate.net/publication/287851106_High_Efficiency_Sweeping_as_an_Aternative_to_the_Use_of_Wet_Vaults_for_Stormwater_Treatment,, ,high-efficiency-sweeping-as-an-alternative-to-the-use-of-wet-vaults-for-stormwater-treatment,CV,\"Advances in Modeling, 1998\"\n" +
      "CWR-032,publication,publications,Simplified Particulate Transport Model SIMPTM User’s Manual,1998,\"SIMPTM modeling methods, diagnosis, or applications for urban runoff pollutant estimation.\",FALSE,,none,,,,simplified-particulate-transport-model-simptm-users-manual,CV,\"Version 3.2, December 1998\"\n" +
      "CWR-033,publication,publications,Contrary to Conventional Wisdom: Street Sweeping Can Be an Effective BMP,1997,Overview of street sweeping as a stormwater pollution abatement strategy and BMP.,FALSE,,researchgate,https://www.researchgate.net/publication/287850173_Contrary_to_Conventional_Wisdom_Street_Sweeping_Can_be_an_Effective_BMP,, ,contrary-to-conventional-wisdom-street-sweeping-can-be-an-effective-bmp,CV,\"Advances in Modeling, 1997\"\n" +
      "CWR-034,publication,publications,Sophisticated Stormwater Quality Modeling is Worth the Effort,1996,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,researchgate,https://www.researchgate.net/publication/287850008_Sophisticated_Stormwater_Quality_Modeling_is_Worth_the_Effort,, ,sophisticated-stormwater-quality-modeling-is-worth-the-effort,CV,\"Advances in Modeling, 1996\"\n" +
      "CWR-035,publication,publications,Studies Show Sweeping has Beneficial Impact on Stormwater Quality,1996,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,studies-show-sweeping-has-beneficial-impact-on-stormwater-quality,CV,\"APWA Reporter, 1996\"\n" +
      "CWR-036,publication,publications,Characterization of Portland’s Stormwater Quality Using SIMPTM,1994,\"SIMPTM modeling methods, diagnosis, or applications for urban runoff pollutant estimation.\",FALSE,,none,,,,characterization-of-portlands-stormwater-quality-using-simptm,CV,\"AWRA Symposium, 1994\"\n" +
      "CWR-037,publication,publications,Characterization of Portland Stormwater Quality,1993,Stormwater characterization study using SIMPTM for Portland-area runoff conditions.,FALSE,,none,,,,characterization-of-portland-stormwater-quality,CV,\"Reno conference, 1993\"\n" +
      "CWR-038,publication,publications,\"Modeling of Urban Runoff Quality in Bellevue, Washington Using SIMPTM\",1991,\"SIMPTM modeling methods, diagnosis, or applications for urban runoff pollutant estimation.\",FALSE,,none,,,,modeling-of-urban-runoff-quality-in-bellevue-washington-using-simptm,CV,\"Report 78, 1991\"\n" +
      "CWR-039,publication,publications,An Overview of Stormwater Quality Modeling,1980,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,none,,,,an-overview-of-stormwater-quality-modeling,CV,\"International Symposium, 1980\"\n" +
      "CWR-040,publication,publications,Modeling the Particulate Characteristics of Sediment Urban Runoff,1980,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,none,,,,modeling-the-particulate-characteristics-of-sediment-urban-runoff,CV,\"Surface Water Impoundments, 1980\"\n" +
      "CWR-041,publication,publications,Toward a More Deterministic Urban Runoff Quality Model,1980,Urban runoff or stormwater quality modeling focused on pollutant loads and control strategies.,FALSE,,researchgate,https://www.researchgate.net/publication/284664659_Toward_a_more_deterministic_urban_runoff-quality_model,, ,toward-a-more-deterministic-urban-runoff-quality-model,CV,\"International Symposium, 1980\"\n" +
      "CWR-042,publication,publications,User’s Guide for Particulate Transport Model-PTM,1980,Particulate transport and pollutant washoff modeling in urban runoff.,FALSE,,none,,,,users-guide-for-particulate-transport-model-ptm,CV,\"USGS, 1980\"\n" +
      "CWR-043,publication,publications,An Approach to Urban Pollutant Washoff Modeling,1979,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,an-approach-to-urban-pollutant-washoff-modeling,CV,\"International Symposium, 1979\"\n" +
      "CWR-044,publication,publications,Simulation of Urban Nonpoint Source Pollution,1978,Early work on urban nonpoint source pollution and runoff loading behavior.,FALSE,,none,,,,simulation-of-urban-nonpoint-source-pollution,CV,\"Water Resources Bulletin, 1978\"\n" +
      "CWR-045,publication,publications,A Mathematical Model for Estimating Pollution Loadings in Runoff from Urban Streets,1976,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,a-mathematical-model-for-estimating-pollution-loadings-in-runoff-from-urban-streets,CV,\"Pentech Press, 1976\"\n" +
      "CWR-046,publication,publications,The Relative Importance of Factors Influencing Pollution Loadings in Runoff from Urban Streets,1976,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,the-relative-importance-of-factors-influencing-pollution-loadings-in-runoff-from-urban-streets,CV,\"ASCE TM No. 31, 1976\"\n" +
      "CWR-047,publication,publications,A Mathematical Model for Estimating Pollution Loadings and Removals from Urban Streets,1975,Stormwater-related publication or presentation selected from Roger Sutherland’s CV.,FALSE,,none,,,,a-mathematical-model-for-estimating-pollution-loadings-and-removals-from-urban-streets,CV,\"M.S. Thesis (unpublished), 1975\"\n" +
      "CWR-048,presentation,presentations,Enhanced Street Sweeping Guidelines: How to Develop a Maximum Value Sweeping Program,2024,Guidance on developing higher-value sweeping programs for stormwater pollutant reduction.,TRUE,1,video,https://www.youtube.com/watch?v=sLEUs3W5X7E,, ,enhanced-street-sweeping-guidelines-how-to-develop-a-maximum-value-sweeping-program,CV,\"Stormwater Awareness Week 2024\"\n" +
      "CWR-049,presentation,presentations,Street Sweeping: America’s First Line of Defense for Stormwater Pollution Runoff Abatement,2023,Overview of street sweeping as a stormwater pollution abatement strategy and BMP.,TRUE,2,none,,,,street-sweeping-americas-first-line-of-defense-for-stormwater-pollution-runoff-abatement,CV,\"Stormwater Awareness Week 2023\"\n" +
      "CWR-050,presentation,presentations,Clean Streets Mean Clean Streams,2013,Educational webinar on how effective sweeping programs reduce stormwater pollutants.,TRUE,3,article,https://www.1800sweeper.com/sweeper-blog/education/upcoming-may-23rd-webinar-clean-streets-mean-clean-streams,, ,clean-streets-mean-clean-streams,CV,\"Forester University webinar May 2013\"\n" +
      "CWR-051,presentation,presentations,Street Dirt: A Better Way of Measuring BMP Effectiveness,2013,Street dirt chemistry and monitoring as a practical way to measure BMP effectiveness.,TRUE,,none,,,,street-dirt-a-better-way-of-measuring-bmp-effectiveness,CV,\"Forester University webinar Nov 2013\"\n" +
      "CWR-052,presentation,presentations,Comprehensive Street Sweeper Pickup Performance Testing for Microplastics and Particulate Material,2025,California Stormwater Awareness Week presentation on controlled sweeper performance testing for microplastics and particulate material.,FALSE,,video,https://vimeo.com/1121691524,, ,comprehensive-street-sweeper-pickup-performance-testing-for-microplastics-and-particulate-material,Additional References docx,\"Direct Vimeo link was embedded in the uploaded DOCX.\"\n" +
      "CWR-053,presentation,presentations,Enhanced Street Sweeping: America’s First Line of Defense in the Abatement of Urban Stormwater Pollution,2025,Minnesota Stormwater Seminar Series presentation on enhanced street sweeping and runoff pollution reduction.,FALSE,,video,https://www.youtube.com/watch?v=xuffhRO3ioQ,, ,enhanced-street-sweeping-americas-first-line-of-defense-in-the-abatement-of-urban-stormwater-pollution,Additional References docx,\"Direct YouTube link was embedded in the uploaded DOCX.\"\n" +
      "CWR-054,external_link,links,Clean Streets = Cleaner Waters Initiative,2026,WorldSweeper/NMSA initiative page referenced in the January-February 2026 newsletter.,TRUE,,article,https://www.worldsweeper.com/Newsletters/2026/Jan_Feb/index.html,, ,clean-streets-cleaner-waters-initiative,web,\"Newsletter page includes the initiative summary and related links.\"\n" +
      "CWR-068,external_link,links,Pioneering Collaboration: Toward a Unified Street Sweeping Optimization Platform,2026,WorldSweeper article about the collaboration between Andrew Sheerin and Roger Sutherland.,TRUE,,article,https://www.worldsweeper.com/Industry/RogerAndrewSoftwareDiscussion2.26.html,, ,roger-andrew-collaboration-article,web,\"WorldSweeper collaboration article.\"\n" +
      "CWR-069,external_link,links,Fathom Solutions,,\"Fathom Solutions website for GIS, analytics, and environmental software work.\",TRUE,,external,https://fathomsolutions.dev/,, ,fathom-solutions,web,\"Link to Andrew/Fathom site.\"\n" +
      "CWR-070,external_link,links,Roger C. Sutherland ResearchGate Profile,,ResearchGate profile listing a subset of Roger Sutherland publications and publication pages.,TRUE,,profile,https://www.researchgate.net/profile/Roger-Sutherland,, ,roger-sutherland-researchgate-profile,web,\"Main publications landing link.\"\n"
    );
  }
})();

