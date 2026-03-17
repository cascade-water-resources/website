/*
  navigation.js
  Small optional JavaScript for simple navigation behavior.

  Phase 1 goals:
  - Keep it minimal
  - Avoid frameworks
  - Make code easy to understand for beginners
*/

(function () {
  "use strict";

  // Highlight the current page in the navigation.
  // This helps users know where they are.
  var currentPath = window.location.pathname;
  var fileName = currentPath.split("/").pop();

  // When opening files locally, pathname can end with "/".
  // In that case, treat it as index.html.
  if (fileName === "") {
    fileName = "index.html";
  }

  var navLinks = document.querySelectorAll(".site-nav a");

  for (var i = 0; i < navLinks.length; i++) {
    var link = navLinks[i];
    var href = link.getAttribute("href");

    if (href === fileName) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  }

  /*
    Header visibility
    -----------------
    The header should stay present while scrolling.
    (We previously experimented with hiding it on scroll down for mobile,
    but this version keeps it always visible.)
  */
})();
