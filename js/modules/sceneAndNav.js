// Animated Pomodoro Scene & Back-to-Top Button

export function initSceneAndNav() {
  initBackToTop();
  initScene();
}

function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  const progressRing = document.getElementById("scroll-progress-ring");
  if (!btn || !progressRing) return;

  const circumference = 2 * Math.PI * 21;
  progressRing.style.strokeDasharray = circumference;
  progressRing.style.strokeDashoffset = circumference;

  function updateScrollProgress() {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    if (scrollHeight <= 0) {
      btn.classList.remove("visible");
      return;
    }

    const progress = scrollTop / scrollHeight;
    const offset = circumference - progress * circumference;
    progressRing.style.strokeDashoffset = offset;

    if (scrollTop > 300) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateScrollProgress();
}

function initScene() {
  const scene = document.getElementById("pomodoro-scene");
  if (!scene) return;

  // Trigger entrance animation once visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          scene.classList.add("scene-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  observer.observe(scene);
}
