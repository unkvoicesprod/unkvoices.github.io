
/*
Chaves do JSON
Beats   /   Kits    /   Posts
*/


document.addEventListener("DOMContentLoaded", () => {
    // Estado da aplicação
    let allContent = [];

    // Cache de elementos do DOM para evitar múltiplas buscas
    const elements = {
        container: document.getElementById("conteudo-container"),
        search: document.getElementById("search"),
        filtroGenero: document.getElementById("filtro-genero"),
        filtroCategoria: document.getElementById("filtro-categoria"),
        filtroAno: document.getElementById("filtro-ano"),
        filtroTipo: document.getElementById("filtro-tipo"),
    };

    // Função principal que inicia a aplicação
    async function init() {
        try {
            const response = await fetch("data/conteudo.json");
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            allContent = await response.json();

            setupEventListeners();
            populateFilters();
            applyFilters(); // Chamada inicial para renderizar o conteúdo da página
        } catch (error) {
            console.error("Falha ao carregar o conteúdo:", error);
            elements.container.innerHTML = `<p class="error-message">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>`;
        }
    }

    function renderContent(list) {
        if (!list.length) {
            elements.container.innerHTML = `<p class="no-results">Nenhum item encontrado.</p>`;
            return;
        }

        elements.container.innerHTML = list.map(item => {
            // Mapeia a categoria para a classe CSS do badge
            const badgeClassMap = {
                "beats": "beat",
                "kits & plugins": "kit",
                "posts": "post",
                "post": "post" // Adicionado para compatibilidade com "Post" singular
            };
            const badgeClass = badgeClassMap[item.categoria.toLowerCase()] || 'post';

            const actionButton = item.preco === 0
                ? `<button class="download">⬇ Baixar</button>`
                : `<button class="download">🛒 Comprar</button>`;

            const playButton = window.location.pathname.includes("beats.html")
                ? `<button class="play">▶ Play</button>`
                : "";

            return `
  <div class="card">
    <img src="${item.capa}" alt="${item.titulo}" loading="lazy" decoding="async">
    <div class="card-content">
      <span class="badge ${badgeClass}">${item.categoria}</span>
      <h3 class="accordion-title">${item.titulo}</h3>
      <p><strong>${item.genero}</strong> - ${item.ano}</p>
      <p>${item.descricao}</p>
      <div class="extra">
        <p><strong>Tipo:</strong> ${item.tipo}</p>
        <p><strong>Preço:</strong> ${item.preco > 0 ? "R$ " + item.preco : "Grátis"}</p>
        <p>${item.conteudo}</p>
      </div>
      <div class="card-footer">
        ${actionButton}
        ${playButton}
      </div>
    </div>
  </div>
`;

        }).join('');

        const cards = elements.container.querySelectorAll('.card');
        observeCards(cards);
    }

    function populateFilters() {
        const getUniqueValues = (key) => [...new Set(allContent.map(item => item[key]).filter(Boolean))];

        fillSelect(elements.filtroGenero, getUniqueValues('genero'));
        fillSelect(elements.filtroCategoria, getUniqueValues('categoria'));
        fillSelect(elements.filtroAno, getUniqueValues('ano').sort((a, b) => b - a)); // Ordena anos do mais recente para o mais antigo
        fillSelect(elements.filtroTipo, getUniqueValues('tipo'));
    }

    function fillSelect(selectElement, values) {
        if (!selectElement) return;
        const fragment = document.createDocumentFragment();
        values.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            fragment.appendChild(option);
        });
        selectElement.appendChild(fragment);
    }

    function applyFilters() {
        const pageFilter = getPageFilter();

        const searchTerm = elements.search.value.toLowerCase();
        const selected = {
            genero: elements.filtroGenero.value,
            categoria: elements.filtroCategoria.value,
            ano: elements.filtroAno.value,
            tipo: elements.filtroTipo.value,
        };

        let baseContent = allContent;

        // 1. Aplicar o filtro base da página (se houver)
        if (pageFilter.categoria) {
            baseContent = allContent.filter(item => item.categoria === pageFilter.categoria);
        } else if (pageFilter.preco === ">0") {
            baseContent = allContent.filter(item => item.preco > 0);
        }

        // Na página inicial, se não houver filtro, mostrar apenas os 3 mais recentes
        const isFiltering = searchTerm || selected.genero || selected.categoria || selected.ano || selected.tipo;
        if (pageFilter.home && !isFiltering) {
            const latestContent = [...allContent]
                .sort((a, b) => b.ano - a.ano || b.id - a.id)
                .slice(0, 3);
            renderContent(latestContent);
            return; // Interrompe a função para mostrar apenas os itens mais recentes
        }

        const filtered = baseContent.filter(item => {
            const matchesSearch = searchTerm === "" ||
                item.titulo.toLowerCase().includes(searchTerm) ||
                item.descricao.toLowerCase().includes(searchTerm) ||
                item.conteudo.toLowerCase().includes(searchTerm);

            const matchesFilters =
                (selected.genero === "" || item.genero === selected.genero) &&
                (selected.categoria === "" || item.categoria === selected.categoria) &&
                (selected.ano === "" || item.ano.toString() === selected.ano) &&
                (selected.tipo === "" || item.tipo === selected.tipo);

            return matchesSearch && matchesFilters;
        });

        renderContent(filtered);
    }

    function handleAccordionClick(event) {
        const title = event.target.closest('.accordion-title');
        if (!title) return;

        const card = title.closest('.card');
        const extra = card.querySelector('.extra');

        card.classList.toggle('active');

        if (card.classList.contains('active')) {
            extra.style.maxHeight = extra.scrollHeight + 'px';
        } else {
            extra.style.maxHeight = null;
        }
    }

    function setupEventListeners() {
        // Delegação de eventos para os cliques no acordeão
        elements.container.addEventListener('click', handleAccordionClick);

        // Listeners para os filtros
        elements.search.addEventListener("input", applyFilters);
        Object.values(elements).filter(el => el && el.tagName === 'SELECT').forEach(select => {
            select.addEventListener('change', applyFilters);
        });
    }

    function getPageFilter() {
        if (window.location.pathname.includes("beats.html")) return { categoria: "Beats" };
        if (window.location.pathname.includes("kits.html")) return { categoria: "Kits & Plugins" };
        if (window.location.pathname.includes("loja.html")) return { preco: ">0" };
        if (window.location.pathname.includes("posts.html")) return { categoria: "Posts" };
        if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith('/')) return { home: true };
        return {};
    }

    function observeCards(cards) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Deixa de observar o elemento após a animação
                }
            });
        }, { threshold: 0.1 }); // A animação começa quando 10% do card está visível

        cards.forEach(card => {
            observer.observe(card);
        });
    }

    // Inicia a aplicação
    init();
});
