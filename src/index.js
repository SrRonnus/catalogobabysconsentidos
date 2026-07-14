import sectionImages from './sectionImages.js';

const sectionTabs = document.getElementById('sectionTabs');
const catalogContainer = document.getElementById('catalogo');
const titleElement = document.getElementById('section-title');
const descriptionElement = document.getElementById('section-description');
const priceElement = document.getElementById('section-price');

let sections = [];
let activeSectionId = null;

async function initCatalog() {
    try {
        const response = await fetch('sections.json');
        if (!response.ok) {
            throw new Error(`Error al cargar secciones: ${response.status}`);
        }

        sections = await response.json();
        renderSectionTabs(sections);
        attachImageClickListeners();

        if (sections.length > 0) {
            setActiveSection(sections[0].id);
        }
    } catch (error) {
        catalogContainer.innerHTML = `<p class="error">No se pudieron cargar las secciones. Intenta de nuevo más tarde.</p>`;
        console.error(error);
    }
}

function renderSectionTabs(sectionData) {
    sectionTabs.innerHTML = sectionData
        .map(
            section => `
                <button type="button" class="section-tab" data-section="${section.id}">${section.nombre}</button>
            `
        )
        .join('');

    sectionTabs.addEventListener('click', event => {
        const button = event.target.closest('[data-section]');
        if (!button) return;

        const sectionId = button.dataset.section;
        setActiveSection(sectionId);
    });
}

async function setActiveSection(sectionId) {
    if (activeSectionId === sectionId) return;

    activeSectionId = sectionId;
    const section = sections.find(item => item.id === sectionId);
    if (!section) return;

    updateSectionInfo(section);
    const imageFiles = sectionImages[sectionId] || [];
    renderCards(section, imageFiles);
    updateActiveTab(sectionId);
}

function updateSectionInfo(section) {
    titleElement.textContent = section.titulo;
    descriptionElement.textContent = section.descripcion;
    priceElement.textContent = section.precio;
}

// Las imágenes se cargan desde sectionImages.js, que se genera automáticamente desde las carpetas.
function renderCards(section, imageFiles) {
    const cards = imageFiles.map(filename => createCard(section, filename));
    catalogContainer.innerHTML = cards.join('');
}

function createCard(section, filename) {
    const imagePath = `${section.carpeta}/${filename}`;
    return `
        <article class="product-card">
            <img src="${imagePath}" alt="Foto de ${section.titulo}" class="product-image" data-fullimage="${imagePath}" />
            <div class="product-info">
                <h3>${section.titulo}</h3>
                <p>${section.descripcion}</p>
                <span class="product-price">A partir de: ${section.precio}</span>
            </div>
        </article>
    `;
}

function attachImageClickListeners() {
    const modal = document.getElementById('imageModal');
    const modalClose = document.getElementById('modalClose');

    catalogContainer.addEventListener('click', event => {
        const image = event.target.closest('.product-image');
        if (!image) return;

        const fullImage = image.dataset.fullimage || image.src;
        openImageModal(fullImage, image.alt);
    });

    modalClose.addEventListener('click', closeImageModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeImageModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('open')) {
            closeImageModal();
        }
    });
}

function openImageModal(src, alt) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modalImage.src = src;
    modalImage.alt = alt;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalImage.src = '';
}

function updateActiveTab(sectionId) {
    const buttons = sectionTabs.querySelectorAll('.section-tab');
    buttons.forEach(button => {
        button.classList.toggle('active', button.dataset.section === sectionId);
    });
}

initCatalog();
