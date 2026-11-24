const page = document.querySelector(".page");
const thumbnailSlide = document.querySelector("#thumbnail");
const aboutSlide = document.querySelector("#about-me");
const compositionSlide = document.querySelector("#composition");
const topbar = document.querySelector(".profile__topbar");
const portfolioMenu = document.querySelector("#portfolio-menu");
const topbarToggle = document.querySelector(".profile__topbar-toggle");
const topbarFlower = topbarToggle.querySelector(".profile__flower-blue");
const navLinks = [...document.querySelectorAll(".profile__nav a")];

const THUMBNAIL_HEIGHT = 950;
const PROFILE_HEIGHT = 1050;
const COMPOSITION_HEIGHT = 2017;
const COMPOSITION_START = THUMBNAIL_HEIGHT + PROFILE_HEIGHT;
const TOPBAR_TOP = 40;

for (const skill of document.querySelectorAll(".profile__skill")) {
  const score = Number(skill.dataset.score);
  const meter = document.createElement("span");
  meter.className = "profile__meter";
  meter.style.setProperty("--fill", `${(score - 1) * 25}%`);
  meter.setAttribute("aria-label", `숙련도 5점 중 ${score}점`);
  meter.innerHTML = "<i></i>".repeat(5);
  skill.append(meter);
}

const startingPositions = {
  "#thumbnail": 0,
  "#about-me": THUMBNAIL_HEIGHT,
  "#composition": COMPOSITION_START,
};
let position = startingPositions[location.hash] ?? 0;
let drag = null;
let suppressClick = false;

function maxPosition() {
  return COMPOSITION_START + Math.max(0, COMPOSITION_HEIGHT - window.innerHeight);
}

function renderPosition(value) {
  position = Math.max(0, Math.min(maxPosition(), value));

  // Each new frame travels upward over the preceding frame. Keep the profile
  // moving until its bottom has passed through the viewport.
  const thumbnailOverflow = Math.max(0, THUMBNAIL_HEIGHT - window.innerHeight);
  const profileOverflow = Math.max(0, PROFILE_HEIGHT - window.innerHeight);
  const thumbnailTop = -Math.min(position, thumbnailOverflow);
  const profileTop = Math.max(THUMBNAIL_HEIGHT - position, -profileOverflow);
  const compositionTop = COMPOSITION_START - position;

  thumbnailSlide.style.transform = `translate3d(0, ${thumbnailTop}px, 0)`;
  aboutSlide.style.transform = `translate3d(0, ${profileTop}px, 0)`;
  compositionSlide.style.transform = `translate3d(0, ${compositionTop}px, 0)`;
  topbar.style.top = `${Math.max(profileTop + TOPBAR_TOP, TOPBAR_TOP)}px`;

  const current = compositionTop < window.innerHeight / 2
    ? "#composition"
    : profileTop < window.innerHeight / 2
      ? "#about-me"
      : "#thumbnail";
  for (const link of navLinks) {
    if (link.getAttribute("href") === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

renderPosition(position);
window.addEventListener("resize", () => renderPosition(position));

page.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (event.target.closest(".profile__topbar")) return;
  drag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startPosition: position,
    moved: false,
  };
});

window.addEventListener("pointermove", event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const deltaX = event.clientX - drag.startX;
  const deltaY = event.clientY - drag.startY;
  if (Math.abs(deltaY) < 3 || Math.abs(deltaY) < Math.abs(deltaX)) return;
  drag.moved = true;
  renderPosition(drag.startPosition + deltaY);
});

function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (drag.moved) {
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 0);
  }
  drag = null;
}

window.addEventListener("pointerup", finishDrag);
window.addEventListener("pointercancel", finishDrag);

page.addEventListener("click", event => {
  if (!suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
}, true);

for (const link of navLinks) {
  link.addEventListener("click", event => {
    event.preventDefault();
    renderPosition(startingPositions[link.getAttribute("href")] ?? 0);
  });
}

topbarToggle.addEventListener("click", () => {
  topbarFlower.getAnimations().forEach(animation => animation.cancel());
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    topbarFlower.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 650, easing: "ease-in-out" },
    );
  }

  const collapsed = portfolioMenu.classList.toggle("is-collapsed");
  portfolioMenu.inert = collapsed;
  portfolioMenu.setAttribute("aria-hidden", String(collapsed));
  topbarToggle.setAttribute("aria-expanded", String(!collapsed));
  topbarToggle.setAttribute("aria-label", collapsed ? "메뉴 보이기" : "메뉴 숨기기");
});

document.addEventListener("wheel", event => {
  if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  event.preventDefault();
  renderPosition(position + event.deltaY);
}, { passive: false });
