class DevJobsAvatar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  createUrl(service, username) {
    return `https://unavatar.io/${service}/${username}`;
  }

  render() {
    const service = this.getAttribute("service") ?? "x";
    const username = this.getAttribute("username") ?? "realmadrid";
    const size = this.getAttribute("size") ?? "40";

    const url = this.createUrl(service, username);

    this.shadowRoot.innerHTML = `

    <style>
      img {
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%
        }
    </style>
    
    <img 
    src="${url}"
    alt="Avatar de ${username}"
    class="avatar"
    />

    `;
  }
  connectedCallback() {
    this.render();
  }
}
customElements.define("devjobs-avatar", DevJobsAvatar);
