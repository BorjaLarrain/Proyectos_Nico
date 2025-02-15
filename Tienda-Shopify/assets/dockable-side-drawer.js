const trapFocusHandlers = {};

/**
 * Removes focus trap event listeners and optionally focuses an element.
 * @param {Element} [elementToFocus=null] - Element to focus when trap is removed.
 */
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

/**
 * Traps focus within a container, e.g. modal or side drawer.
 * @param {Element} container - Container element to trap focus within.
 * @param {Element} [elementToFocus=container] - Initial element to focus when trap is applied.
 */
function trapFocus(container, elementToFocus = container) {
  const focusableEls = Array.from(
    container.querySelectorAll('summary, a[href], area[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), object, iframe, audio[controls], video[controls], [tabindex]:not([tabindex^="-"])')
  );

  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (evt) => {
    if (evt.target !== container && evt.target !== lastEl && evt.target !== firstEl) return;
    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = () => {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = (evt) => {
    if (evt.code !== 'Tab') return;

    // If tab pressed on last focusable element, focus the first element.
    if (evt.target === lastEl && !evt.shiftKey) {
      evt.preventDefault();
      firstEl.focus();
    }

    //  If shift + tab pressed on the first focusable element, focus the last element.
    if ((evt.target === container || evt.target === firstEl) && evt.shiftKey) {
      evt.preventDefault();
      lastEl.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  (elementToFocus || container).focus();
}

class DockableSideDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = document.querySelector('.js-overlay');
    this.isDocked = false;

    if (theme.settings.dockCartDrawer) {
      this.updateDockedState();
      this.resizeHandler = this.resizeHandler || this.updateDockedState.bind(this);
      window.addEventListener('on:debounced-resize', this.resizeHandler);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('on:debounced-resize', this.resizeHandler);
  }

  updateDockedState() {
    const wasDocked = this.isDocked;
    this.isDocked = window.matchMedia('(min-width: 1100px)').matches;

    if (!wasDocked && this.isDocked) {
      this.open();
    } else if (wasDocked) {
      this.close();
    }

    if (this.isDocked) {
      document.documentElement.style.height = '';
      document.body.style.top = '';
      document.body.classList.remove('fixed');

      this.overlay.classList.remove('is-visible');
      document.body.classList.add('cart-drawer-docked');
    } else {
      document.body.classList.remove('cart-drawer-docked');
    }
  }

  /**
   * Handles a 'click' event on the drawer.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (!this.isDocked && (evt.target.matches('.js-close-drawer') || evt.target === this.overlay)) {
      this.close();
    }
  }

  /**
   * Opens the drawer.
   * @param {Element} [opener] - Element that triggered opening of the drawer.
   * @param {Element} [elementToFocus] - Element to focus after drawer opened.
   * @param {Function} [callback] - Callback function to trigger after the open has completed
   */
  open(opener, elementToFocus, callback) {
    this.dispatchEvent(new CustomEvent(`on:${this.dataset.name}:before-open`, {
      bubbles: true
    }));

    if (!this.isDocked) {
      // Prevent page behind from scrolling when side drawer is open.
      this.scrollY = window.scrollY;
      document.body.classList.add('fixed');
      document.body.style.top = `-${this.scrollY}px`;
      document.documentElement.style.height = '100vh';

      this.overlay.classList.add('is-visible');
    }

    this.setAttribute('open', '');
    this.setAttribute('aria-hidden', 'false');
    this.opener = opener;

    if (!this.isDocked) {
      trapFocus(this, elementToFocus);
    }

    // Create event handler variables (so the bound event listeners can be removed).
    this.clickHandler = this.clickHandler || this.handleClick.bind(this);
    this.keyupHandler = (evt) => {
      if (evt.key !== 'Escape' || evt.target.closest('.cart-drawer-popup')) return;
      this.close();
    };

    // Add event listeners (for while drawer is open).
    this.addEventListener('click', this.clickHandler);
    this.addEventListener('keyup', this.keyupHandler);
    this.overlay.addEventListener('click', this.clickHandler);

    // Handle events after the drawer opens
    const transitionDuration = parseFloat(getComputedStyle(this).getPropertyValue('--longest-transition-in-ms'));
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(new CustomEvent(`on:${this.dataset.name}:after-open`, {
        bubbles: true
      }));
    }, transitionDuration);
  }

  /**
   * Closes the drawer.
   * @param {Function} [callback] - Call back function to trigger after the close has completed
   */
  close(callback) {
    if (this.isDocked) return;

    this.dispatchEvent(new CustomEvent(`on:${this.dataset.name}:before-close`, {
      bubbles: true
    }));

    this.removeAttribute('open');
    this.setAttribute('aria-hidden', 'true');
    this.overlay.classList.remove('is-visible');

    removeTrapFocus(this.opener);

    // Restore page position and scroll behaviour.
    document.documentElement.style.height = '';
    document.body.style.top = '';
    document.body.classList.remove('fixed');
    window.scrollTo(0, this.scrollY);

    // Remove event listeners added on drawer opening.
    this.removeEventListener('click', this.clickHandler);
    this.removeEventListener('keyup', this.keyupHandler);
    this.overlay.removeEventListener('click', this.clickHandler);

    // Handle events after the drawer closes
    const transitionDuration = parseFloat(getComputedStyle(this).getPropertyValue('--longest-transition-in-ms'));
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(new CustomEvent(`on:${this.dataset.name}:after-close`, {
        bubbles: true
      }));
    }, transitionDuration);
  }
}

customElements.define('persistent-side-drawer', DockableSideDrawer);
