const progressRingStyles = new CSSStyleSheet();

progressRingStyles.replaceSync(`
  :host {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }

  :host(.hidden) {
    opacity: 0;
    pointer-events: none;
  }

  svg {
    transform: rotate(90deg) scaleX(-1);
  }

  .progress-ring__circle {
    transition: stroke-dashoffset 0.35s;
    transform-origin: 50% 50%;
    stroke-linecap: round;
  }
`);

class ProgressRing extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [progressRingStyles];
  }

  static get observedAttributes() {
    return ["stroke", "size", "stroke-width", "progress"];
  }

  connectedCallback() {
    this.render();
    this.initializeCircle();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot.querySelector("svg")) {
      if (name === "progress") {
        this.setProgress(parseFloat(newValue) || 0);
      } else {
        this.render();
        this.initializeCircle();
      }
    }
  }

  get stroke() {
    return this.getAttribute("stroke") || "var(--color-primary)";
  }

  get size() {
    return parseInt(this.getAttribute("size")) || 220;
  }

  get strokeWidth() {
    return parseInt(this.getAttribute("stroke-width")) || 9;
  }

  get progress() {
    return parseFloat(this.getAttribute("progress")) || 0;
  }

  set progress(value) {
    this.setAttribute("progress", value.toString());
  }

  render() {
    const size = this.size;
    const strokeWidth = this.strokeWidth;
    const stroke = this.stroke;
    const radius = size / 2 - strokeWidth * 2;
    const center = size / 2;

    this.shadowRoot.innerHTML = `
      <svg width="${size}" height="${size}">
        <circle
          class="progress-ring__circle-bg"
          stroke="#e6e6e6"
          stroke-width="${strokeWidth}"
          fill="transparent"
          r="${radius}"
          cx="${center}"
          cy="${center}"
        />
        <circle
          class="progress-ring__circle"
          stroke="${stroke}"
          stroke-width="${strokeWidth}"
          fill="transparent"
          r="${radius}"
          cx="${center}"
          cy="${center}"
        />
      </svg>
    `;
  }

  initializeCircle() {
    const circle = this.getCircle();
    if (!circle) return;

    const circumference = this.getCircumference(circle);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = "0";

    // set initial progress
    if (this.progress) {
      this.setProgress(this.progress);
    }
  }

  setProgress(percent) {
    const circle = this.getCircle();
    if (!circle) return;

    const circumference = this.getCircumference(circle);
    const offset = circumference - (percent / 100) * circumference;

    circle.style.strokeDashoffset = offset.toString();
  }

  getCircle() {
    return this.shadowRoot.querySelector(".progress-ring__circle");
  }

  getCircumference(circle) {
    const radius = circle.r.baseVal.value;
    return radius * 2 * Math.PI;
  }
}

customElements.define("progress-ring", ProgressRing);
