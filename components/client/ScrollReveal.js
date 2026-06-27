"use client";

import { useEffect } from "react";

const revealSelector = [
  "main > section",
  ".motion-card",
  ".surface",
  ".stagger-list > *",
  "main article",
  "main aside",
  "main figure",
  "main form",
  "main table"
].join(",");

function revealDelay(index) {
  return `${Math.min(index % 8, 7) * 55}ms`;
}

export default function ScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.add("reveal-disabled");
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -9% 0px",
        threshold: 0.12
      }
    );

    function registerReveals(root = document) {
      const elements = [
        ...(root.matches?.(revealSelector) ? [root] : []),
        ...Array.from(root.querySelectorAll(revealSelector))
      ];

      elements.forEach((element, index) => {
        if (element.closest("[data-no-reveal]") || element.dataset.revealRegistered === "true") {
          return;
        }

        element.dataset.revealRegistered = "true";
        element.style.setProperty("--reveal-delay", revealDelay(index));
        element.classList.add("reveal-on-scroll");
        observer.observe(element);
      });
    }

    registerReveals();
    document.documentElement.classList.add("reveal-ready");

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            registerReveals(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
