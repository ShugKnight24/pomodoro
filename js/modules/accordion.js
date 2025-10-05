"use strict";

const accordionHeadings = document.querySelectorAll(".accordion-heading");

export function initAccordion() {
  accordionHeadings.forEach((heading) => {
    heading.addEventListener("click", handleAccordionClick);
  });
}

/**
 * Handle accordion heading click & toggle accordion body visibility via slide animation
 * @param {Event} event - Click event
 */
function handleAccordionClick(event) {
  event.stopPropagation();

  const accordionHeading = event.currentTarget;
  const accordion = accordionHeading.parentElement;
  const accordionBody = accordion.nextElementSibling;

  accordion.classList.toggle("accordion-active");
  accordionBody.classList.toggle("accordion-active");

  // accordionBody slide animation
  if (accordionBody.classList.contains("accordion-active")) {
    // Opening
    accordionBody.style.display = "block";
    // Force reflow for transition to work
    accordionBody.offsetHeight;
    accordionBody.style.maxHeight = accordionBody.scrollHeight + "px";
  } else {
    // Closing
    accordionBody.style.maxHeight = "0";
    // Hide after animation completes
    setTimeout(() => {
      if (!accordionBody.classList.contains("accordion-active")) {
        accordionBody.style.display = "none";
      }
    }, 300); // Match CSS transition duration
  }
}
