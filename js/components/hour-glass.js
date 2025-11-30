const hourglassStyles = new CSSStyleSheet();

hourglassStyles.replaceSync(`
  :host {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    transition: opacity var(--transition-base, 0.3s ease);
  }

  :host(.hidden) {
    opacity: 0;
    pointer-events: none;
    display: block !important;
  }

  svg {
    display: block;
  }

  .sand-stream {
    animation: sandFlow 0.3s linear infinite;
    opacity: 0.9;
  }

  .sand-stream.hidden {
    display: none;
    animation: none;
  }

  @keyframes sandFlow {
    to {
      stroke-dashoffset: -3;
    }
  }
`);

// TODO: Don't start w/ completely full placeholder
// Have sand on bottom and on start animate a rotation and have sand fall
class Hourglass extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [hourglassStyles];
  }

  static get observedAttributes() {
    return ["fill", "size", "progress"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot.querySelector("svg")) {
      if (name === "progress") {
        this.updateSand(parseFloat(newValue) || 0);
      } else {
        this.render();
      }
    }
  }

  get fill() {
    return this.getAttribute("fill") || "var(--color-primary)";
  }

  get size() {
    return parseInt(this.getAttribute("size")) || 220;
  }

  get progress() {
    return parseFloat(this.getAttribute("progress")) || 0;
  }

  set progress(value) {
    this.setAttribute("progress", value.toString());
  }

  render() {
    const size = this.size;
    const fill = this.fill;
    const clipId = `clip-${Math.random().toString(36).substring(2, 9)}`;

    this.shadowRoot.innerHTML = `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <defs>
          <clipPath id="${clipId}-top">
            <path d="M25,5 L75,5 L75,25 C75,40 55,45 50,50 C45,45 25,40 25,25 Z" />
          </clipPath>
          <clipPath id="${clipId}-bottom">
            <path d="M25,95 L75,95 L75,75 C75,60 55,55 50,50 C45,55 25,60 25,75 Z" />
          </clipPath>
        </defs>
        
        <!-- Glass Frame -->
        <path
          d="M25,5 L75,5 L75,25 C75,40 55,45 50,50 C45,45 25,40 25,25 Z"
          fill="none"
          stroke="#333"
          stroke-width="3"
        />
        <path
          d="M25,95 L75,95 L75,75 C75,60 55,55 50,50 C45,55 25,60 25,75 Z"
          fill="none"
          stroke="#333"
          stroke-width="3"
        />
        
        <!-- Sand -->
        <rect
          class="sand-top"
          x="0"
          y="0"
          width="100"
          height="50"
          clip-path="url(#${clipId}-top)"
          fill="${fill}"
        />
        <line
          class="sand-stream hidden"
          x1="50"
          y1="50"
          x2="50"
          y2="95"
          stroke="${fill}"
          stroke-width="1"
          stroke-dasharray="1 1"
        />
        <rect
          class="sand-bottom"
          x="0"
          y="50"
          width="100"
          height="50"
          clip-path="url(#${clipId}-bottom)"
          fill="${fill}"
        />
      </svg>
    `;
  }

  updateSand(percent) {
    const topSand = this.shadowRoot.querySelector(".sand-top");
    const bottomSand = this.shadowRoot.querySelector(".sand-bottom");

    if (!topSand || !bottomSand) return;

    const sandHeight = 45;
    const topHeight = (percent / 100) * sandHeight;
    const bottomHeight = sandHeight - topHeight;

    topSand.setAttribute("height", Math.max(0, topHeight).toString());
    topSand.setAttribute("y", (50 - topHeight).toString());

    bottomSand.setAttribute("height", Math.max(0, bottomHeight).toString());
    bottomSand.setAttribute("y", (95 - bottomHeight).toString());
  }

  showSandStream(show) {
    const stream = this.shadowRoot.querySelector(".sand-stream");
    if (!stream) return;

    if (show) {
      stream.classList.remove("hidden");
    } else {
      stream.classList.add("hidden");
    }
  }
}

customElements.define("hour-glass", Hourglass);
