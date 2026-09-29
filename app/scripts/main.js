import Swiper from "swiper/bundle";

// swiper for the Hero section

const heroBackgroundSwiper = new Swiper(".hero__background-images", {
  loop: false,
});

const featuredProjectsSwiper = new Swiper(".hero__featured-projects", {
  loop: false,
  navigation: {
    nextEl: ".hero__featured-projects-next",
    prevEl: ".hero__featured-projects-prev",
  },
});

heroBackgroundSwiper.controller.control = featuredProjectsSwiper;
featuredProjectsSwiper.controller.control = heroBackgroundSwiper;

// swiper for the Projects section

const projectsListSwiper = new Swiper(".projects__list", {
  loop: false,
  watchOverflow: true,
  slidesPerView: 2,
  slidesPerGroup: 2,
  spaceBetween: 32,
  grid: {
    rows: 2,
    fill: "row",
  },
  navigation: {
    prevEl: ".projects__list-button-prev",
    nextEl: ".projects__list-button-next",
  },
  pagination: {
    el: ".projects__list-pagination",
    clickable: true,
  },
  breakpoints: {
    0: {
      slidesPerView: 1.25,
      slidesPerGroup: 1,
      grid: {
        rows: 1,
        fill: "row",
      },
    },
    801: {
      slidesPerView: 2,
      slidesPerGroup: 2,
      grid: {
        rows: 2,
        fill: "row",
      },
    },
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 },
  );

  document
    .querySelectorAll(".fade-in-element")
    .forEach((item) => intersectionObserver.observe(item));
});
