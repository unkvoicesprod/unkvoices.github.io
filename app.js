
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const logo = document.getElementById("logo");

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    if (logo) logo.src = "assets/img/logo-black.png";
  }

  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light");
    if (document.body.classList.contains("light")) {
      localStorage.setItem("theme", "light");
      if (logo) logo.src = "assets/img/logo-black.png";
    } else {
      localStorage.setItem("theme", "dark");
      if (logo) logo.src = "assets/img/logo-white.png";
    }
  });

  // Popup
  const popupBtn = document.getElementById("popupBtn");
  const popupForm = document.getElementById("popupForm");
  const closePopup = document.getElementById("closePopup");

  popupBtn?.addEventListener("click", () => popupForm.classList.toggle("hidden"));
  closePopup?.addEventListener("click", () => popupForm.classList.add("hidden"));

  // Render JSON content
  async function loadContent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;
    try {
      const res = await fetch(file);
      const data = await res.json();
      data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${item.cover}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.artist || ""}</p>
          <button onclick="window.open('${item.action}','_blank')">Acessar</button>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar", file, err);
    }
  }

  loadContent("beatsGrid", "data/beats.json");
  loadContent("kitsGrid", "data/kits.json");
  loadContent("pluginsGrid", "data/plugins.json");
  loadContent("tutorialsGrid", "data/tutorials.json");
});
