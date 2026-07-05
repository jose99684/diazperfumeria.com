function formatCurrencyAmount(amount, currencyCode) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  });
  return formatter.format(amount);
}

function getAmount(config) {
  const rewardBasis = config.rewardBasis;
  const cart = window.hitsyCart;

  if (rewardBasis === "cart-total") {
    const amount =
      config.discountSetup === "auto"
        ? cart.original_total_price
        : cart.items_subtotal_price;
    return amount / 100;
  } else {
    return cart.item_count;
  }
}

function getCart(config, cart) {
  if (config.productExcludeType === "no-exclude") return cart;

  cart.items = cart.items.filter((item) => {
    const excludedIds = config.excludedProducts.map((id) => {
      const list = id.split("/");
      return list[list.length - 1];
    });
    return !excludedIds.includes(item.product_id.toString());
  });
  cart.item_count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.original_total_price = cart.items.reduce(
    (sum, item) => sum + item.original_line_price,
    0,
  );
  cart.items_subtotal_price = cart.items.reduce(
    (sum, item) => sum + item.final_line_price,
    0,
  );

  return cart;
}

function createTexts(configIndex) {
  const config = window.hitsyProgress[configIndex];

  const rewardBasis = config.rewardBasis;
  const tiers =
    rewardBasis === "cart-total"
      ? config.tiersCartTotal
      : config.tiersNumberOfItems;
  const currencyCode = config.currencyCode;
  const amount = getAmount(config);

  const currentTierIndex = tiers
    .map((tier) => tier.amount)
    .reduceRight((foundIndex, amountValue, index) => {
      return foundIndex === -1 && amountValue <= amount ? index : foundIndex;
    }, -1);
  const isLastTier = currentTierIndex === tiers.length - 1;

  const nextTier =
    currentTierIndex === -1
      ? tiers[0]
      : isLastTier
        ? null
        : tiers[currentTierIndex + 1];
  const previousTier = currentTierIndex > -1 ? tiers[currentTierIndex] : null;
  const afterText = previousTier?.textAfterAchieving || "";

  if (!nextTier) return ["", afterText];

  const leftAmount = nextTier.amount - amount;
  const formattedAmount =
    rewardBasis === "cart-total"
      ? formatCurrencyAmount(leftAmount, currencyCode)
      : leftAmount.toString();
  const beforeText = nextTier.textBeforeAchieving.replace(
    "{amount}",
    formattedAmount,
  );

  return [beforeText, afterText];
}

const hitsyText = "hitsy-text";

class HitsyText extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ["text"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text" && oldValue !== newValue) {
      this.updateText(newValue);
    }
  }

  render() {
    if (this.hasChildNodes()) return;

    const config = window.hitsyProgress[this.getAttribute("configIndex")];
    const textType = this.getAttribute("textType");
    const textAlign =
      textType === "before"
        ? config.inProgressTextAlign
        : config.achievedTextAlign;
    const textSize = config.textSize;
    const textColor = config.textColor;
    const text = this.getAttribute("text") || "";

    this.textView = document.createElement("div");
    this.textView.style.width = "100%";
    this.textView.style.textAlign = textAlign;
    this.textView.style.lineHeight = 1.5;
    this.textView.style.fontSize = `${textSize}px`;
    this.textView.style.color = textColor;
    this.textView.innerHTML = text;

    this.appendChild(this.textView);
  }

  updateText(text) {
    if (text) {
      this.style.display = "block";
      this.textView.innerHTML = text;
    } else {
      this.style.display = "none";
    }
  }
}

customElements.define(hitsyText, HitsyText);

const hitsyIcon = "hitsy-icon";

const freeShippingIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z"/></svg>`;
const discountIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/><path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/></svg>`;
const giftIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.798 7.992c-.343-.756-1.098-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Zm-.962 1.508h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .462.142.563.363l.403.887Zm3.79 0h-.96l.403-.887c.1-.221.32-.363.563-.363.34 0 .619.278.619.622 0 .347-.282.628-.625.628Z"/><path fill-rule="evenodd" d="M2.499 6.75c0-1.519 1.231-2.75 2.75-2.75h9.5c1.519 0 2.75 1.231 2.75 2.75v2.945l.002.055c0 .018 0 .037-.002.055v3.445c0 1.519-1.231 2.75-2.75 2.75h-9.5c-1.519 0-2.75-1.231-2.75-2.75v-6.5Zm13.5 2.25h-1.248c-.414 0-.75.336-.75.75s.336.75.75.75h1.248v2.75c0 .69-.56 1.25-1.25 1.25h-4.748v-1c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1h-3.252c-.69 0-1.25-.56-1.25-1.25v-2.792c.292-.102.502-.38.502-.708 0-.327-.21-.606-.502-.708v-2.292c0-.69.56-1.25 1.25-1.25h3.252v.75c0 .414.336.75.75.75s.75-.336.75-.75v-.75h4.748c.69 0 1.25.56 1.25 1.25v2.25Z"/></svg>`;

class HitsyIcon extends HTMLElement {
  connectedCallback() {
    this.config = window.hitsyProgress[this.getAttribute("configIndex")];
    this.tiers =
      this.config.rewardBasis === "cart-total"
        ? this.config.tiersCartTotal
        : this.config.tiersNumberOfItems;
    this.tier = this.tiers[this.getAttribute("tierIndex")];
    this.size = this.getAttribute("size");
    this.circleOutlineInProgressColor = this.config.circleOutlineInProgressColor || "#00000041";
    this.circleOutlineAchievedColor = this.config.circleOutlineAchievedColor || "#00000041";

    this.render();

    window.addEventListener("Hitsy:cartUpdated", () => this.onCartUpdated());
  }

  disconnectedCallback() {
    window.removeEventListener("Hitsy:cartUpdated", () => this.onCartUpdated());
  }

  render() {
    if (this.hasChildNodes()) return;

    this.style.height = `${this.size}px`;
    this.style.width = `${this.size}px`;
    this.style.borderRadius = "50%";
    this.style.boxSizing = "border-box";
        
    if (!this.config.hideIcons) {
      switch (this.tier.rewardType) {
        case "free-shipping":
          this.icon = new DOMParser().parseFromString(freeShippingIcon, "image/svg+xml").documentElement;
          break;
        case "order-discount":
          this.icon = new DOMParser().parseFromString(discountIcon, "image/svg+xml").documentElement;
          break;
        case "free-gift":
          this.icon = new DOMParser().parseFromString(giftIcon, "image/svg+xml").documentElement;
          break;
      }
      this.appendChild(this.icon);
    }
    this.onCartUpdated();
  }

  setBackground(achieved) {
    this.style.background = achieved
      ? this.config.circleAchievedColor
      : this.config.circleInProgressColor;
  }

  setIconColor(achieved) {
    if (this.config.hideIcons) return;
    this.icon.style.fill = achieved
      ? this.config.iconAchievedColor
      : this.config.iconInProgressColor;
  }

  setCircleOutlineColor(achieved) {
    if (this.config.hideIcons) {
      this.style.border = undefined;
      return;
    }
    this.style.border = achieved
      ? `${this.circleOutlineAchievedColor} solid 2px`
      : `${this.circleOutlineInProgressColor} solid 2px`;
  }

  onCartUpdated() {
    const achieved = this.tier.amount <= getAmount(this.config);
    this.setBackground(achieved);
    this.setIconColor(achieved);
    this.setCircleOutlineColor(achieved);
  }
}

customElements.define(hitsyIcon, HitsyIcon);

const hitsyProgress = "hitsy-progress";

class HitsyProgress extends HTMLElement {
  constructor() {
    super();
    this.resizeObserver = new ResizeObserver((entries) => {
      this.lastProgressWidth = entries[0].contentRect.width;
      this.updateIconsPositions();
    });
  }

  connectedCallback() {
    this.config = window.hitsyProgress[this.getAttribute("configIndex")];
    this.updateValues();

    this.render();

    window.addEventListener("Hitsy:cartUpdated", () => this.onCartUpdated());
    const child = this.querySelector(".hitsy-progress-background");
    if (child) {
      this.resizeObserver.observe(child);
    }
  }
  disconnectedCallback() {
    window.removeEventListener("Hitsy:cartUpdated", () => this.onCartUpdated());
    const child = this.querySelector(".hitsy-progress-background");
    if (child) {
      this.resizeObserver.unobserve(child);
    }
  }

  updateValues() {
    this.amount = getAmount(this.config);
    this.tiers = this.calculateTiers(this.config, this.amount);
  }

  onCartUpdated() {
    this.updateValues();
    this.updateProgress();
    this.renderIcons();
  }

  render() {
    if (this.hasChildNodes()) return;

    const barThickness = this.config.barThickness;
    this.iconSize = barThickness * 3;

    this.style.marginRight = `${this.iconSize / 2}px`;

    const container = document.createElement("div");
    container.classList.add("hitsy-progress-background");
    container.style.width = "100%";
    container.style.position = "relative";
    container.style.display = "flex";
    container.style.height = `${this.iconSize}px`;
    container.style.justifyContent = "center";
    container.style.alignItems = "center";

    this.foreground = document.createElement("div");
    this.foreground.style.width = "0%";
    this.foreground.style.height = "100%";
    this.foreground.style.backgroundColor = this.config.barColor;
    this.foreground.style.display = "flex";
    this.foreground.style.justifyContent = "center";
    this.foreground.style.alignItems = "center";
    this.foreground.style.transition = "width 1s ease-in-out";

    const progressBackground = document.createElement("div");
    progressBackground.style.display = "flex";
    progressBackground.style.width = "100%";
    progressBackground.style.backgroundColor = this.config.barBackgroundColor;
    progressBackground.style.borderRadius = "50px";
    progressBackground.style.overflow = "hidden";
    progressBackground.style.height = `${barThickness}px`;
    progressBackground.appendChild(this.foreground);
    container.appendChild(progressBackground);

    this.appendChild(container);
    this.renderIcons();

    this.updateProgress();
  }

  renderIcons() {
    const currentIcons = this.querySelectorAll(".hitsy-progress-icon");
    if (this.tiers.length === currentIcons.length) return;
    currentIcons.forEach((icon) => icon.remove());
    this.tiers.forEach((_tier, index) => {
      const icon = document.createElement(hitsyIcon);
      icon.classList.add("hitsy-progress-icon");
      icon.setAttribute("configIndex", this.getAttribute("configIndex"));
      icon.setAttribute("tierIndex", index);
      icon.setAttribute("size", this.iconSize);

      icon.style.position = "absolute";
      icon.style.top = `0px`;

      this.querySelector(".hitsy-progress-background").appendChild(icon);
    });
    this.updateIconsPositions();
  }

  calculateTiers(config, amount) {
    const tiers =
      config.rewardBasis === "cart-total"
        ? config.tiersCartTotal
        : config.tiersNumberOfItems;
    if (config.displayCurrentTierOnly) {
      const index = tiers.findIndex((tier) => amount < tier.amount);
      if (index === -1) return tiers;
      return tiers.slice(0, index + 1);
    } else {
      return tiers;
    }
  }

  calculateProgress() {
    if (this.amount >= this.tiers[this.tiers.length - 1].amount) return 100;
    const tierWidth = 100 / this.tiers.length;

    let width = 0;

    let calculatedAmount = 0;
    for (let i = 0; i < this.tiers.length; i++) {
      const tier = this.tiers[i];

      if (this.amount >= tier.amount) {
        width += tierWidth;
        calculatedAmount = tier.amount;
      } else {
        const tierDifference = this.amount - calculatedAmount;
        const tierProgress =
          (tierDifference / (tier.amount - calculatedAmount)) * tierWidth;
        width += tierProgress;
        return width;
      }
    }
    return 100;
  }

  updateIconsPositions() {
    const tierWidth = this.lastProgressWidth / this.tiers.length;
    this.querySelectorAll(".hitsy-progress-icon").forEach((icon) => {
      const index = parseInt(icon.getAttribute("tierIndex"));
      icon.style.left = `${(index + 1) * tierWidth - this.iconSize / 2}px`;
    });
  }

  updateProgress() {
    const progress = this.calculateProgress(this.amount);
    this.foreground.style.width = `${progress}%`;
  }
}

customElements.define(hitsyProgress, HitsyProgress);

const hitsyCard = "hitsy-card";

class HitsyCard extends HTMLElement {
  connectedCallback() {
    this.configIndex = this.getAttribute("configIndex");
    this.config = window.hitsyProgress[this.configIndex];
    this.horizontalPadding = this.config.horizontalPadding ?? 32;
    this.verticalPadding = this.config.verticalPadding ?? 16;
    this.gapBetweenElements = this.config.gapBetweenElements ?? 10;

    this.render();
    window.addEventListener("Hitsy:cartUpdated", () => this.updateTexts());
  }

  disconnectedCallback() {
    window.removeEventListener("Hitsy:cartUpdated", () => this.updateTexts());
  }

  render() {
    if (this.hasChildNodes()) return;

    this.card = document.createElement("div");
    this.card.classList.add("hitsy-card");
    this.card.style.border = `${this.config.cardBorderSize}px solid ${this.config.cardBorderColor}`;
    this.card.style.borderRadius = `${this.config.cardCornerRadius}px`;
    this.card.style.backgroundColor = this.config.cardBackgroundColor;
    this.card.style.padding = `${this.verticalPadding}px ${this.horizontalPadding}px`;
    this.card.style.display = "flex";
    this.card.style.flexDirection = "column";
    this.card.style.gap = `${this.gapBetweenElements}px`;

    this.beforeTextView = document.createElement(hitsyText);
    this.beforeTextView.setAttribute("configIndex", this.configIndex);
    this.beforeTextView.setAttribute("textType", "before");

    this.afterTextView = document.createElement(hitsyText);
    this.afterTextView.setAttribute("configIndex", this.configIndex);
    this.afterTextView.setAttribute("textType", "after");

    this.progress = document.createElement(hitsyProgress);
    this.progress.setAttribute("configIndex", this.configIndex);

    this.card.appendChild(this.beforeTextView);
    this.card.appendChild(this.progress);
    this.card.appendChild(this.afterTextView);

    this.appendChild(this.card);
    this.updateTexts();
  }

  updateTexts() {
    const [beforeText, afterText] = createTexts(this.configIndex);
    this.beforeTextView.setAttribute("text", beforeText);
    this.afterTextView.setAttribute("text", afterText);
  }
}

customElements.define(hitsyCard, HitsyCard);

const hitsyContainer = "hitsy-container";

class HitsyContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.config = window.hitsyProgress[this.getAttribute("configIndex")];
    this.cart = window.hitsyCart;
    this.marginPosition = this.getAttribute("marginPosition");
    this.maxWidth = this.getAttribute("maxWidth") || "100%";

    this.render();
    this.updateVisibility();

    window.addEventListener("Hitsy:cartUpdated", () => this.onCartUpdate());
  }

  disconnectedCallback() {
    window.removeEventListener("Hitsy:cartUpdated", () => this.onCartUpdate());
  }

  render() {
    if (this.shadowRoot.hasChildNodes()) return;

    this.container = document.createElement("div");
    this.container.style.marginBottom = this.marginPosition.includes("bottom")
      ? "16px"
      : undefined;
    this.container.style.marginTop = this.marginPosition.includes("top")
      ? "16px"
      : undefined;
    this.container.style.maxWidth = this.maxWidth;

    this.card = document.createElement(hitsyCard);
    this.card.setAttribute("configIndex", this.getAttribute("configIndex"));
    this.container.appendChild(this.card);

    this.shadowRoot.appendChild(this.container);
  }

  onCartUpdate() {
    this.cart = window.hitsyCart;
    this.updateVisibility();
  }

  updateVisibility() {
    if (this.config.hideWhenCartIsEmpty) {
      const cartIsEmpty = this.cart.item_count < 1;
      this.container.style.display = cartIsEmpty ? "none" : "block";
    } else {
      this.container.style.display = "block";
    }
  }
}

customElements.define(hitsyContainer, HitsyContainer);

function startHitsyCartSync(config) {
  let debounceTimeout = null;
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const isValidRequestType = ['xmlhttprequest', 'fetch'].includes(entry.initiatorType);
      const isResponseOk =  entry.responseStatus === undefined || entry.responseStatus === 200;

      const ShopifyCartURLs = [
          "/cart/update",
          "/cart/change",
          "/cart/clear",
          "/cart/update.js",
          "/cart/change.js",
          "/cart/clear.js",
          "?section_id=cart-drawer",
          "/cart/add",
          "/cart/add.js",
        ];

      if (isValidRequestType && isResponseOk && ShopifyCartURLs.some(url => entry.name.includes(url))) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          updateCart();
        }, 300);
      }
    });
  }).observe({ entryTypes: ["resource"] });

  function updateCart() {
    fetch("/cart.js")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((cart) => {
        window.hitsyCart = getCart(config, cart);
        window.dispatchEvent(new CustomEvent("Hitsy:cartUpdated"));
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
}

const cartDrawerTargets = [
  ".cart__empty-text",
  ".drawer__content.drawer__content--center",
  ".empty-state__icon-wrapper",
  ".cart-drawer__line-items",
  ".cart-drawer__empty-content",
  'form[action="/cart"] #CartContainer',
  'form[action="/cart"] .da_trustbadge + .Drawer__Container',
  'form[action="/en-me/cart"]',
  'form[action="/fr-ca/cart"]',
  "#drawer-cart .drawer__content .drawer__body",
  'form[action="/cart"] .drawer__inner',
  "#cart-notification #cart-notification-product",
  ".order-value-booster-side-cart .cart-drawer__items",
  "#Cart-Drawer .side-panel-content",
  "#cartSlideoutWrapper .ajax-cart--top-wrapper",
  "#cart-drawer .cart-drawer__items",
  'form[action="/cart"] .cart-list',
  "#dropdnMinicartPopup .cart-form-element",
  "cart-notification-drawer .quick-buy-drawer__info",
  "cart-drawer .cart-drawer__line-items",
  "#CartDrawer .ajaxcart__product",
  "sidebar-drawer#site-cart-sidebar .sidebar__body",
  "hdt-cart-drawer .hdt-mini-cart__header-title",
  ".mini-cart-wrap.drawer #header-mini-cart-content",
  'form[action="/cart"]',
  "#CartDrawer-Form",
  "#halo-cart-sidebar .previewCart-wrapper",
  ".cart-container .w-commerce-commercecartform",
  ".qsc2-drawer .qsc2-drawer-rows",
  ".snippet-quick-cart .cart-items",
  ".mini-cart #mini-cart-form",
  "cart-form.cart-drawer .cart-item-list",
  ".js-minicart .product-cart",
];
const productTargets = [
  ".product-form__buttons",
  ".product-form",
  ".product-info",
];
const cartPageTargets = [
  "cart-items .page-width",
  "cart-items",
  "#main section .empty-state",
  "#main section .page-content",
  ".cart",
  "form[action='/cart']",
];
const config = window.hitsyProgress[0];
if (config && config.currencyCode === window.hitsyCart.currency) {
  let startSync = false;
  if (
    window.hitsyTemplate.startsWith("product") &&
    config.displayPages.includes("product")
  ) {
    if (!isProductExcluded(config)) {
      renderProgress();
      startSync = true;
    }
  }

  if (config.displayPages.includes("cart")) {
    renderProgressInCartNotificationOrDrawer();
    if (window.hitsyTemplate.startsWith("cart")) {
      cartPageTargets.some((target) => {
        const targetElement = document.querySelector(target);
        if (targetElement) {
          const container = document.createElement(hitsyContainer);
          container.setAttribute("configIndex", 0);
          container.setAttribute("marginPosition", "top|bottom");
          targetElement.prepend(container);
          return true;
        }
        return false;
      });
    }
    startSync = true;
  }

  const customPlacements = document.querySelectorAll(".hitsy-progress-block");
  customPlacements.forEach((placement) => {
    if (!placement.hasChildNodes()) {
      const container = document.createElement(hitsyContainer);
      container.setAttribute("configIndex", 0);
      container.setAttribute("marginPosition", "top|bottom");
      placement.appendChild(container);
    }
  });
  if (customPlacements.length !== 0) startSync = true;

  if (startSync) startHitsyCartSync(config);
}

function observeCartDrawer() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => checkForHitsyContainer());
  });

  const cartDrawer = document.querySelector("cart-drawer");
  if (cartDrawer) {
    observer.observe(cartDrawer, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }
}

function observeCartNotification() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => renderHitsyContainerInNotification());
  });

  const cartNotification = document.querySelector("#cart-notification");
  if (cartNotification) {
    observer.observe(cartNotification, { childList: true, subtree: true });
  }
}

function checkForHitsyContainer() {
  const cartDrawer = document.querySelector("cart-drawer");
  if (cartDrawer) {
    const hitsyContainer = cartDrawer.querySelector("hitsy-container");
    if (!hitsyContainer) {
      renderProgressInDrawer();
    }
  }
}

function renderHitsyContainerInNotification() {
  const cartNotification = document.querySelector("#cart-notification");
  if (cartNotification) {
    const currentProgress = cartNotification.querySelector(hitsyContainer);
    if (!currentProgress) {
      const container = document.createElement(hitsyContainer);
      container.setAttribute("configIndex", 0);
      container.setAttribute("marginPosition", "top");

      const targetElement = cartNotification.querySelector(
        "#cart-notification-product",
      );
      cartNotification.insertBefore(container, targetElement);
    }
  }
}

function renderProgress() {
  productTargets.some((target) => {
    const targetElement = document.querySelector(target);
    if (targetElement) {
      const container = document.createElement(hitsyContainer);
      container.setAttribute("configIndex", 0);
      container.setAttribute("marginPosition", "top");
      container.setAttribute("maxWidth", "44rem");

      targetElement.appendChild(container);
      return true;
    }
    return false;
  });
}

function renderProgressInCartNotificationOrDrawer() {
  observeCartDrawer();
  observeCartNotification();
}

function renderProgressInDrawer() {
  cartDrawerTargets.some((target) => {
    const targetElement = document.querySelector(target);
    if (targetElement) {
      const container = document.createElement(hitsyContainer);
      container.setAttribute("configIndex", 0);
      container.setAttribute("marginPosition", "bottom");
      targetElement.parentNode.insertBefore(container, targetElement);
      return true;
    }
    return false;
  });
}

function isProductExcluded(config) {
  if (config.productExcludeType === "no-exclude") return false;

  let excludedIds = config.excludedProducts;

  if (excludedIds.length === 0) return false;

  return excludedIds.some((id) => {
    const split = id.split("/");
    return split[split.length - 1] === window.hitsyProduct.id.toString();
  });
}
