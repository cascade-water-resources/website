/*
  navigation.js
*/

(function () {
  "use strict";

  // Highlight the current page in the navigation.
  var currentPath = window.location.pathname;
  var fileName = currentPath.split("/").pop();

  // When opening files locally, pathname can end with "/".
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


})();
