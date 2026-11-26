const page = document.querySelector(".page");
const introSlide = document.querySelector("#intro");
const thumbnailSlide = document.querySelector("#thumbnail");
const aboutSlide = document.querySelector("#about-me");
const compositionSlide = document.querySelector("#composition");
const compositionFooter = document.querySelector(".composition__footer");
const compositionFooterTitle = compositionFooter.querySelector("p");
const compositionCards = document.querySelector(".composition__cards");
const compositionInner = compositionSlide.querySelector(".composition");
const topbar = document.querySelector(".profile__topbar");
const portfolioMenu = document.querySelector("#portfolio-menu");
const topbarToggle = document.querySelector(".profile__topbar-toggle");
const topbarFlower = topbarToggle.querySelector(".profile__flower-blue");
const introSkip = document.querySelector(".intro__skip");
const introDigits = document.querySelector(".intro__digits");
const introProgress = document.querySelector(".intro__progress");
const navLinks = [...document.querySelectorAll(".profile__nav a")];

const INTRO_HEIGHT = 950;
const THUMBNAIL_HEIGHT = 950;
const PROFILE_HEIGHT = 1050;
const COMPOSITION_HEIGHT = 1757;
const THUMBNAIL_START = INTRO_HEIGHT;
const PROFILE_START = THUMBNAIL_START + THUMBNAIL_HEIGHT;
const COMPOSITION_START = PROFILE_START + PROFILE_HEIGHT;
// Once the middle of the contents cards lines up with the middle of the screen, the page
// stays pinned while the visitor scrolls through one step per card, plus a short hold.
const CARD_SCROLL_STEP = 260;
const CARD_PIN_HOLD = 160;
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
  "#intro": 0,
  "#thumbnail": THUMBNAIL_START,
  "#about-me": PROFILE_START,
  "#composition": COMPOSITION_START,
};
let position = startingPositions[location.hash] ?? 0;
// The intro frame stays put until the SKIP button is pressed.
let introUnlocked = position > 0;
// Once the thumbnail has fully covered the intro, the intro is gone for good:
// scrolling back up stops at the thumbnail.
let introLeft = position >= THUMBNAIL_START;
let currentSlide = null;
const arrowGroup = document.querySelector(".arrow-group");
let drag = null;
let suppressClick = false;
compositionFooter.classList.add("is-pending");
const compositionCardItems = [...compositionCards.children];
// Hide the cards straight away on load, without playing their hide transition.
for (const card of compositionCardItems) card.style.transition = "none";
compositionCards.classList.add("is-scroll-reveal");
compositionCards.offsetHeight;
for (const card of compositionCardItems) card.style.transition = "";
// How many cards (counted from the left) should be showing, and how many are.
let cardsTarget = 0;
let cardsShown = 0;
let cardsTimer = null;
const CARD_STEP_MS = 480;

function stepCards() {
  cardsTimer = null;
  if (cardsShown === cardsTarget) return;
  if (cardsShown < cardsTarget) {
    compositionCardItems[cardsShown].classList.add("is-revealed");
    cardsShown++;
  } else {
    cardsShown--;
    compositionCardItems[cardsShown].classList.remove("is-revealed");
  }
  if (cardsShown !== cardsTarget) cardsTimer = setTimeout(stepCards, CARD_STEP_MS);
}

function setCardsTarget(count) {
  cardsTarget = count;
  if (!cardsTimer && cardsShown !== cardsTarget) stepCards();
}

function cardPinDistance() {
  return compositionCardItems.length * CARD_SCROLL_STEP + CARD_PIN_HOLD;
}

// How much of a masked slide is still hidden (1 = all of it, 0 = none) while its scroll
// distance to the top of the screen is `top`.
function maskHidden(top) {
  return Math.min(Math.max(top / window.innerHeight, 0), 1);
}

// A slide whose top edge is still below the top of the screen stays in place and is uncovered
// from left to right as the visitor scrolls (an image mask reveal), instead of sliding in.
function placeMaskedSlide(slide, top) {
  if (top > 0) {
    slide.style.transform = "translate3d(0, 0, 0)";
    slide.style.clipPath = `inset(0 ${maskHidden(top) * 100}% 0 0)`;
  } else {
    slide.style.transform = `translate3d(0, ${top}px, 0)`;
    slide.style.clipPath = "none";
  }
}

// How far past the top of the contents page the scroll must go to bring the middle of the
// card row to the middle of the screen.
function cardPinScroll() {
  const pageBounds = compositionSlide.getBoundingClientRect();
  const cardsBounds = compositionCards.getBoundingClientRect();
  const cardsCenter = cardsBounds.top - pageBounds.top + cardsBounds.height / 2;
  return Math.max(0, cardsCenter - window.innerHeight / 2);
}

function maxPosition() {
  if (!introUnlocked) return Math.max(0, INTRO_HEIGHT - window.innerHeight);
  return COMPOSITION_START + cardPinDistance() + Math.max(cardPinScroll(), COMPOSITION_HEIGHT - window.innerHeight);
}

function renderPosition(value) {
  position = Math.max(introLeft ? THUMBNAIL_START : 0, Math.min(maxPosition(), value));
  if (position >= THUMBNAIL_START) introLeft = true;

  // Each new frame travels upward over the preceding frame.
  const introOverflow = Math.max(0, INTRO_HEIGHT - window.innerHeight);
  const thumbnailOverflow = Math.max(0, THUMBNAIL_HEIGHT - window.innerHeight);
  const introTop = -Math.min(position, introOverflow);
  const thumbnailTop = Math.max(THUMBNAIL_START - position, -thumbnailOverflow);
  // The about me page is not held in place at its bottom: it keeps scrolling up and the
  // contents page follows straight after it, as one continuous page.
  const profileTop = PROFILE_START - position;
  // The contents page scrolls up until its card row sits in the middle of the screen, stays
  // pinned there while the cards come in, then carries on scrolling.
  const pinStart = COMPOSITION_START + cardPinScroll();
  const pinOffset = Math.min(Math.max(position - pinStart, 0), cardPinDistance());
  const compositionTop = COMPOSITION_START - (position - pinOffset);

  introSlide.style.transform = `translate3d(0, ${introTop}px, 0)`;
  placeMaskedSlide(thumbnailSlide, thumbnailTop);
  placeMaskedSlide(aboutSlide, profileTop);
  // Pages fully covered by the next one are hidden, so nothing shows through
  // while the contents page fades in.
  introSlide.style.visibility = thumbnailTop <= 0 ? "hidden" : "";
  thumbnailSlide.style.visibility = profileTop <= 0 ? "hidden" : "";
  compositionSlide.style.transform = `translate3d(0, ${compositionTop}px, 0)`;
  // The contents page fades up as it scrolls in below the about me page.
  const compositionEntered = Math.min(Math.max((window.innerHeight - compositionTop) / (window.innerHeight * 0.7), 0), 1);
  compositionSlide.style.opacity = compositionEntered;
  compositionInner.style.transform = `translate3d(0, ${(1 - compositionEntered) * 120}px, 0)`;
  // The top bar stays put and is uncovered by the same left-to-right mask as the about me page.
  topbar.style.top = `${TOPBAR_TOP}px`;
  if (profileTop > 0) {
    const maskEdge = window.innerWidth * (1 - maskHidden(profileTop));
    const topbarBounds = topbar.getBoundingClientRect();
    const hiddenWidth = Math.min(Math.max(topbarBounds.right - maskEdge, 0), topbarBounds.width);
    topbar.style.clipPath = `inset(0 ${hiddenWidth}px 0 0)`;
  } else {
    topbar.style.clipPath = "none";
  }

  // While the contents page is pinned, each step of scroll brings in the next card from the
  // left; cards always come in one at a time, left to right, even on a fast scroll.
  // Scrolling back hides them in reverse.
  setCardsTarget(position <= pinStart ? 0 : Math.min(compositionCardItems.length, Math.ceil(pinOffset / CARD_SCROLL_STEP)));

  const footerTitleBounds = compositionFooterTitle.getBoundingClientRect();
  if (footerTitleBounds.top <= window.innerHeight - footerTitleBounds.height / 2 && footerTitleBounds.bottom > 0 && compositionFooter.classList.contains("is-pending")) {
    const decorItems = [...compositionFooter.querySelectorAll(".composition__decor > *")];
    const delays = decorItems.map((_, index) => index * 12);
    for (let index = delays.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [delays[index], delays[randomIndex]] = [delays[randomIndex], delays[index]];
    }

    for (const [index, item] of decorItems.entries()) {
      const translatedY = Number.parseFloat(getComputedStyle(item).translate.split(" ")[1]) || 0;
      const restingBottom = item.getBoundingClientRect().bottom - translatedY;
      // Place the entire image above the viewport before the shared drop begins.
      item.style.setProperty("--drop-height", `${-Math.ceil(restingBottom + 48)}px`);
      item.style.setProperty("--fall-delay", `${delays[index]}ms`);
    }
    compositionFooter.classList.replace("is-pending", "is-revealed");
  } else if (footerTitleBounds.top >= window.innerHeight + 40) {
    compositionFooter.classList.replace("is-revealed", "is-pending");
  }

  const current = compositionTop < window.innerHeight / 2
    ? "#composition"
    : profileTop < window.innerHeight / 2
      ? "#about-me"
      : thumbnailTop < window.innerHeight / 2
        ? "#thumbnail"
        : "#intro";
  // The thumbnail's pieces walk in each time it becomes the current page,
  // and go back off-stage once the thumbnail is out of sight.
  if (current !== currentSlide) {
    if (current === "#thumbnail" && !thumbnailEntered) playThumbnailEntrance();
    currentSlide = current;
  }
  if (thumbnailEntered && (thumbnailTop >= window.innerHeight || profileTop <= 0)) resetThumbnailEntrance();

  for (const link of navLinks) {
    if (link.getAttribute("href") === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const thumbnailCanvas = document.querySelector("#thumbnail-canvas");
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 950;
// The base papers stay put; every sticker/tape/button walks in from outside the frame.
const thumbnailWalkers = [
  ...thumbnailCanvas.querySelectorAll(":scope > .art:not(.art--background, .art--torn-paper, .art--grid-paper)"),
  arrowGroup,
];
for (const walker of thumbnailWalkers) walker.classList.add("is-walker");

// Split the title into single letters so each one can fly in from a scattered spot.
const titleChars = [];
for (const part of document.querySelectorAll(".title__port, .title__folio")) {
  const text = part.textContent.trim();
  part.textContent = "";
  for (const char of text) {
    const letter = document.createElement("span");
    letter.className = "title__char";
    letter.textContent = char;
    part.append(letter);
    titleChars.push(letter);
  }
}

let thumbnailEntered = false;
let entranceRun = 0;
let entranceAnimations = [];
const random = (min, max) => min + Math.random() * (max - min);

function bobArrow() {
  arrowGroup.classList.remove("is-bobbing");
  void arrowGroup.offsetWidth;
  arrowGroup.classList.add("is-bobbing");
}

// A wobbly stop-and-go path: hop, freeze, hop, freeze... until it lands in place.
function walkKeyframes(element) {
  const left = element.offsetLeft;
  const top = element.offsetTop;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  // Start just outside the nearest edge of the frame.
  const edges = [
    { distance: centerX, x: -(left + width + 80), y: 0 },
    { distance: CANVAS_WIDTH - centerX, x: CANVAS_WIDTH - left + 80, y: 0 },
    { distance: centerY, x: 0, y: -(top + height + 80) },
    { distance: CANVAS_HEIGHT - centerY, x: 0, y: CANVAS_HEIGHT - top + 80 },
  ];
  const edge = edges.reduce((nearest, candidate) => candidate.distance < nearest.distance ? candidate : nearest);
  const length = Math.hypot(edge.x, edge.y);
  // Perpendicular to the walking direction, used for the zig-zag.
  const sideX = -edge.y / length;
  const sideY = edge.x / length;
  const startX = edge.x + sideX * random(-90, 90);
  const startY = edge.y + sideY * random(-90, 90);

  const steps = 4 + Math.floor(Math.random() * 2);
  const moveShare = 0.5;
  const hopEasing = "cubic-bezier(0.45, 0, 0.9, 0.6)";
  const landEasing = "cubic-bezier(0.1, 0.4, 0.3, 1)";
  const frames = [];
  let prevX = startX;
  let prevY = startY;
  let prevTilt = random(-14, 14);
  frames.push({ offset: 0, translate: `${prevX}px ${prevY}px`, rotate: `${prevTilt}deg`, easing: hopEasing });

  for (let step = 1; step <= steps; step++) {
    const segmentStart = (step - 1) / steps;
    const segmentLength = 1 / steps;
    const last = step === steps;
    const progress = step / steps;
    const zigzag = last ? 0 : (step % 2 ? 1 : -1) * random(18, 48);
    const x = startX * (1 - progress) + sideX * zigzag;
    const y = startY * (1 - progress) + sideY * zigzag;
    const tilt = last ? 0 : (step % 2 ? -1 : 1) * random(5, 13);
    const arrive = last ? 1 : segmentStart + segmentLength * moveShare;
    const lift = segmentStart + (arrive - segmentStart) / 2;

    // Mid-hop: lifted slightly and leaning, like a little step.
    frames.push({
      offset: lift,
      translate: `${(prevX + x) / 2}px ${(prevY + y) / 2 - random(12, 22)}px`,
      rotate: `${(prevTilt + tilt) / 2 + (step % 2 ? 6 : -6)}deg`,
      easing: landEasing,
    });
    frames.push({ offset: arrive, translate: `${x}px ${y}px`, rotate: `${tilt}deg`, easing: "linear" });
    // Freeze in place until the next hop starts.
    if (!last) frames.push({ offset: segmentStart + segmentLength, translate: `${x}px ${y}px`, rotate: `${tilt}deg`, easing: hopEasing });

    prevX = x;
    prevY = y;
    prevTilt = tilt;
  }
  return { frames, duration: steps * random(430, 520) };
}

// The title letters start scattered around the frame and fly back into the word.
function gatherTitle() {
  thumbnailCanvas.classList.remove("is-walking");
  for (const letter of titleChars) {
    const angle = random(0, Math.PI * 2);
    const distance = random(260, 620);
    entranceAnimations.push(letter.animate([
      {
        translate: `${Math.cos(angle) * distance}px ${Math.sin(angle) * distance}px`,
        rotate: `${random(-160, 160)}deg`,
        scale: `${random(0.4, 0.8)}`,
        opacity: 0,
        filter: "blur(6px)",
      },
      { translate: "0px 0px", rotate: "0deg", scale: "1", opacity: 1, filter: "blur(0px)" },
    ], { duration: random(950, 1300), delay: random(0, 380), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }));
  }
}

function playThumbnailEntrance() {
  thumbnailEntered = true;
  const run = ++entranceRun;
  if (reduceMotion.matches) {
    thumbnailCanvas.classList.remove("is-waiting", "is-walking");
    return;
  }

  // Give the SKIP zoom time to settle before anything starts walking.
  const startDelay = thumbnailSlide.classList.contains("is-expanding") ? 750 : 120;
  thumbnailCanvas.classList.remove("is-waiting");
  thumbnailCanvas.classList.add("is-walking");
  entranceAnimations = thumbnailWalkers.map(walker => {
    const { frames, duration } = walkKeyframes(walker);
    return walker.animate(frames, { duration, delay: startDelay + random(0, 550), fill: "backwards" });
  });

  Promise.all(entranceAnimations.map(animation => animation.finished))
    .then(() => {
      if (run !== entranceRun) return;
      bobArrow();
      gatherTitle();
    })
    .catch(() => {});
}

function resetThumbnailEntrance() {
  thumbnailEntered = false;
  entranceRun++;
  for (const animation of entranceAnimations) animation.cancel();
  entranceAnimations = [];
  arrowGroup.classList.remove("is-bobbing");
  thumbnailCanvas.classList.remove("is-walking");
  thumbnailCanvas.classList.add("is-waiting");
}

renderPosition(position);
window.addEventListener("resize", () => renderPosition(position));

function setIntroProgress(value) {
  introDigits.textContent = String(value);
  introProgress.setAttribute("aria-label", `${value}%`);
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setIntroProgress(100);
} else {
  const countDuration = 2800;
  let countStart;
  function countUp(timestamp) {
    countStart ??= timestamp;
    const elapsed = Math.min(timestamp - countStart, countDuration);
    setIntroProgress(Math.floor(elapsed / countDuration * 100));
    if (elapsed < countDuration) requestAnimationFrame(countUp);
  }
  setTimeout(() => requestAnimationFrame(countUp), 500);
}

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

introSkip.addEventListener("click", () => {
  // The thumbnail grows from a small card over the intro until it fills the screen;
  // from there the visitor scrolls on to the next pages.
  introUnlocked = true;
  if (!reduceMotion.matches) {
    thumbnailSlide.classList.remove("is-expanding");
    void thumbnailSlide.offsetWidth;
    thumbnailSlide.classList.add("is-expanding");
  }
  renderPosition(THUMBNAIL_START);
});

thumbnailSlide.addEventListener("animationend", event => {
  if (event.animationName === "thumbnail-expand") thumbnailSlide.classList.remove("is-expanding");
});

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
  // Scrolling never leaves the intro on its own; only the SKIP button opens the way on.
  renderPosition(position + event.deltaY);
}, { passive: false });
