const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const menuBtn = $('#menu-btn'), nav = $('#main-nav');
function syncMobileNavSize() {
  const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
  nav.style.setProperty('--mobile-nav-top', `${Math.max(0, headerBottom)}px`);
  nav.style.setProperty('--mobile-nav-height', `${Math.max(220, window.innerHeight - Math.max(0, headerBottom))}px`);
}
function closeMobileMenu(keepLayer = false) {
  nav.classList.remove('open'); nav.setAttribute('aria-hidden', 'true');
  menuBtn.classList.remove('active'); menuBtn.setAttribute('aria-expanded', 'false');
  if (!keepLayer && !drawer.classList.contains('open') && !checkout.classList.contains('open')) { overlay.classList.remove('open'); lockPage(false); }
}
function openMobileMenu() {
  syncMobileNavSize(); toggleSearch(false);
  nav.classList.add('open'); nav.setAttribute('aria-hidden', 'false');
  menuBtn.classList.add('active'); menuBtn.setAttribute('aria-expanded', 'true');
  overlay.classList.add('open'); lockPage(true);
}
menuBtn.addEventListener('click', () => nav.classList.contains('open') ? closeMobileMenu() : openMobileMenu());
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMobileMenu()));
nav.setAttribute('aria-hidden', String(window.innerWidth <= 760));
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) {
    nav.classList.remove('open'); nav.setAttribute('aria-hidden', 'false');
    menuBtn.classList.remove('active'); menuBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('open'); lockPage(false);
  } else {
    nav.setAttribute('aria-hidden', String(!nav.classList.contains('open')));
    if (nav.classList.contains('open')) syncMobileNavSize();
  }
});

const searchPanel = $('#search-panel');
function toggleSearch(open) { searchPanel.classList.toggle('open', open); searchPanel.setAttribute('aria-hidden', String(!open)); if (open) setTimeout(() => $('#search-input').focus(), 350); }
$('#search-btn').addEventListener('click', () => { closeMobileMenu(); toggleSearch(true); });
$('#search-close').addEventListener('click', () => toggleSearch(false));

const filters = $$('.filter-pills button'), products = $$('.product-card');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active')); button.classList.add('active');
  products.forEach((card, index) => {
    const visible = button.dataset.filter === 'all' || card.dataset.type === button.dataset.filter;
    card.classList.toggle('hidden', !visible);
    if (visible && card.animate) card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: index * 45, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
}));

const toast = $('#toast');
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200); }

const drawer = $('#cart-drawer'), overlay = $('#page-overlay'), cartItems = $('#cart-items'), checkout = $('#checkout-modal');
const storage = {
  get() { try { const value = JSON.parse(localStorage.getItem('aurelia-cart') || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } },
  set(value) { try { localStorage.setItem('aurelia-cart', JSON.stringify(value)); } catch { /* Cart remains available for this session. */ } }
};
let cart = storage.get();
let lockedScroll = 0;
const money = value => `$${value.toFixed(2)}`;
const quantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);
const subtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
function saveCart() { storage.set(cart); }
function lockPage(locked) {
  if (locked && !document.body.classList.contains('no-scroll')) {
    lockedScroll = window.scrollY;
    document.body.style.top = `-${lockedScroll}px`;
    document.body.classList.add('no-scroll');
  } else if (!locked && document.body.classList.contains('no-scroll')) {
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, lockedScroll);
  }
}
function openCart() { closeMobileMenu(true); toggleSearch(false); renderCart(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); overlay.classList.add('open'); lockPage(true); }
function closeCart() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if (!checkout.classList.contains('open')) { overlay.classList.remove('open'); lockPage(false); } }
function closeCheckout() { checkout.classList.remove('open'); checkout.setAttribute('aria-hidden', 'true'); overlay.classList.remove('open'); lockPage(false); }
function cardProduct(card) {
  const name = card.querySelector('h3').textContent;
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, kind: card.querySelector('.product-kind').textContent, price: Number(card.querySelector('.price strong').textContent.replace('$', '')), image: card.querySelector('img').src, quantity: 1 };
}
function addProduct(product) {
  const item = cart.find(entry => entry.id === product.id); item ? item.quantity++ : cart.push(product);
  saveCart(); renderCart(); showToast(`${product.name} added to your bag`);
  if ($('#cart-count').animate) $('#cart-count').animate([{ transform: 'scale(.7)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 440, easing: 'ease-out' });
}
function updateQuantity(id, amount) { const item = cart.find(entry => entry.id === id); if (!item) return; item.quantity += amount; if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id); saveCart(); renderCart(); }
function removeProduct(id, row) { row.classList.add('removing'); setTimeout(() => { cart = cart.filter(item => item.id !== id); saveCart(); renderCart(); showToast('Item removed'); }, 280); }
function renderCart() {
  const count = quantity(), amount = subtotal();
  $('#cart-count').textContent = count; $('#cart-title-count').textContent = `(${count})`; $('#cart-subtotal').textContent = money(amount);
  $('#cart-empty').classList.toggle('visible', !cart.length); $('#cart-footer').classList.toggle('hidden', !cart.length); cartItems.style.display = cart.length ? 'block' : 'none';
  const progress = Math.min(100, amount / 60 * 100); $('#delivery-bar').style.width = `${progress}%`; $('#delivery-percent').textContent = `${Math.round(progress)}%`;
  $('#delivery-text').textContent = amount >= 60 ? 'You unlocked complimentary delivery' : `Add ${money(60 - amount)} for complimentary delivery`;
  cartItems.innerHTML = cart.map(item => `<article class="cart-item" data-id="${item.id}"><img src="${item.image}" alt=""><div class="cart-item-info"><small>${item.kind}</small><h3>${item.name}</h3><strong>${money(item.price)}</strong><div class="item-quantity"><button data-action="minus" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="plus" aria-label="Increase quantity">+</button></div></div><button class="remove-item" data-action="remove">Remove</button></article>`).join('');
}
cartItems.addEventListener('click', event => {
  const button = event.target.closest('button'), row = event.target.closest('.cart-item'); if (!button || !row) return;
  if (button.dataset.action === 'plus') updateQuantity(row.dataset.id, 1); if (button.dataset.action === 'minus') updateQuantity(row.dataset.id, -1); if (button.dataset.action === 'remove') removeProduct(row.dataset.id, row);
});
$$('.quick-add').forEach(button => button.addEventListener('click', () => addProduct(cardProduct(button.closest('.product-card')))));
$$('.wish').forEach(button => button.addEventListener('click', () => { button.classList.toggle('active'); button.textContent = button.classList.contains('active') ? '♥' : '♡'; showToast(button.classList.contains('active') ? 'Saved to your wishlist' : 'Removed from wishlist'); }));
$('#cart-btn').addEventListener('click', openCart); $('#cart-close').addEventListener('click', closeCart); $('#keep-shopping').addEventListener('click', closeCart); $('#empty-shop').addEventListener('click', closeCart);
overlay.addEventListener('click', () => { closeMobileMenu(); closeCart(); closeCheckout(); });

function renderCheckout() {
  $('#checkout-items').innerHTML = cart.map(item => `<div class="checkout-summary-item"><img src="${item.image}" alt=""><div><h4>${item.name}</h4><small>Qty ${item.quantity}</small></div><strong>${money(item.price * item.quantity)}</strong></div>`).join('');
  updateCheckoutTotal();
}
function updateCheckoutTotal() {
  const express = $('input[name="delivery"]:checked')?.value === 'Express';
  $('#checkout-subtotal').textContent = money(subtotal());
  $('#checkout-delivery').textContent = express ? '$12.00' : 'Complimentary';
  $('#checkout-total').textContent = money(subtotal() + (express ? 12 : 0));
}
$$('input[name="delivery"]').forEach(option => option.addEventListener('change', () => {
  $$('.delivery-option').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
  updateCheckoutTotal();
}));
$('#checkout-btn').addEventListener('click', () => {
  closeCart(); renderCheckout();
  $('#checkout-form').style.display = 'block'; $('.checkout-intro').style.display = 'block'; $('#checkout-success').classList.remove('visible');
  checkout.classList.add('open'); checkout.setAttribute('aria-hidden', 'false'); overlay.classList.add('open'); lockPage(true);
});
$('#checkout-close').addEventListener('click', closeCheckout);
$('#checkout-form').addEventListener('submit', event => { event.preventDefault(); event.currentTarget.style.display = 'none'; $('.checkout-intro').style.display = 'none'; $('#checkout-success').classList.add('visible'); });
$('#back-to-shop').addEventListener('click', closeCheckout);

$('#newsletter-form').addEventListener('submit', event => { event.preventDefault(); $('#form-message').textContent = 'Welcome to Aurelia — your 10% code is AURELIA10.'; $('#form-message').classList.add('success'); event.currentTarget.querySelector('input').value = ''; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { toggleSearch(false); closeMobileMenu(); closeCart(); closeCheckout(); } });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: .08, rootMargin: '0px 0px -35px' });
  $$('.reveal').forEach((element, index) => { element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`; observer.observe(element); });
} else {
  $$('.reveal').forEach(element => element.classList.add('visible'));
}
$$('.delivery-option').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
renderCart();
