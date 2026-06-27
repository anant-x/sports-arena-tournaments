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

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  return rect.top < viewportHeight * 0.94 && rect.bottom > 0 && rect.left < viewportWidth && rect.right > 0;
}

export default function ScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.add("reveal-disabled");
      return undefined;
    }

    const pending = new Set();

    function showElement(element) {
      element.classList.add("is-visible");
      pending.delete(element);
      observer.unobserve(element);
    }

    function checkPending() {
      const elements = new Set([
        ...pending,
        ...Array.from(document.querySelectorAll(".reveal-on-scroll:not(.is-visible)"))
      ]);

      elements.forEach((element) => {
        if (isInViewport(element)) {
          showElement(element);
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            showElement(entry.target);
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

        if (isInViewport(element)) {
          showElement(element);
          return;
        }

        pending.add(element);
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

    window.addEventListener("scroll", checkPending, { passive: true });
    window.addEventListener("resize", checkPending);
    window.requestAnimationFrame(checkPending);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      pending.clear();
      window.removeEventListener("scroll", checkPending);
      window.removeEventListener("resize", checkPending);
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
