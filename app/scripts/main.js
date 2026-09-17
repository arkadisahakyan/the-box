import Swiper from "swiper/bundle";

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

document.addEventListener("DOMContentLoaded", () => {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll(".fade-in-element")
    .forEach((item) => intersectionObserver.observe(item));
});
