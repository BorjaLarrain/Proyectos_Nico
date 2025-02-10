if (!customElements.get('products-toolbar')) {
  class ProductsToolbar extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.filtersComponent = document.querySelector('facet-filters');
      this.filtersColumn = document.querySelector('.main-products-grid__filters');
      this.layoutSwitcher = this.querySelector('.products-toolbar__layout');
      this.sortBy = this.querySelector('.products-toolbar__sort');
      this.productsGrid = document.querySelector('.main-products-grid');

      if (this.filtersColumn) {
        this.filterToggle = this.querySelector('.js-toggle-filters');
        this.filterToggle.addEventListener('click', this.toggleFilters.bind(this));
      }

      if (this.layoutSwitcher) {
        this.layoutSwitcher.addEventListener('change', this.handleLayoutChange.bind(this));

        // Set the layout to the layout in localstorage
        const layout = theme.storageUtil.get('products-layout');
        if (layout && layout === 'list') {
          const toggle = document.getElementById(`${layout}-layout-opt`);
          if (toggle) toggle.click();
        }
      }

      if (!this.filtersComponent && this.sortBy) {
        this.sortBy.addEventListener('change', ProductsToolbar.handleSortByChange);
      }
    }

    /**
     * Toggles open/closed state of the filters on desktop.
     */
    toggleFilters() {
      this.filterToggle.classList.toggle('is-active');
      this.filtersOpen = this.filterToggle.classList.contains('is-active');
      this.filterToggle.setAttribute('aria-expanded', this.filtersOpen);

      if (theme.mediaMatches.lg) {
        this.filtersColumn.classList.toggle('lg:js-hidden', !this.filtersOpen);
        const productsList = document.querySelector('.main-products-grid__results > .grid');

        productsList.className = this.filtersOpen
          ? productsList.dataset.filtersOpenClasses
          : productsList.dataset.filtersClosedClasses;
      } else {
        this.filtersComponent.open();
      }
    }

    /**
     * Handles 'change' events on the layout switcher buttons.
     * @param {object} evt - Event object.
     */
    handleLayoutChange(evt) {
      this.productsGrid.dataset.layout = evt.target.value;
      theme.storageUtil.set('products-layout', evt.target.value);
    }

    /**
     * Handles when a sort by dropdown is changed (and filtering is disabled)
     * @param {object} evt - Event object.
     */
    static handleSortByChange(evt) {
      const urlObj = new URL(window.location.href);
      urlObj.searchParams.set('sort_by', evt.detail.selectedValue);
      urlObj.hash = 'products-toolbar';
      window.location.href = urlObj.toString();
    }
  }

  customElements.define('products-toolbar', ProductsToolbar);
}
