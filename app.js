(() => {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asset = (v) => String(v || '').trim();
  const niceDate = (v) => { if (!v) return 'Date to be announced'; const d = new Date(v + 'T00:00:00'); return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}); };

  async function loadContent() {
    try {
      const response = await fetch('/content.json?ts=' + Date.now(), {cache:'no-store'});
      if (!response.ok) return;
      const content = await response.json();
      if (content.siteImages?.logo) { const img = document.getElementById('siteLogo'); if (img) img.src = asset(content.siteImages.logo); }
      if (content.siteImages?.founder) { const img = document.getElementById('founderImage'); if (img) img.src = asset(content.siteImages.founder); }
      const contact = content.contact || {};
      const email = document.getElementById('contactEmail'); if (email && contact.email) { email.textContent = contact.email; const a = email.closest('a'); if (a) a.href = 'mailto:' + contact.email; }
      const address = document.getElementById('contactAddress'); if (address && contact.address) address.textContent = contact.address;
      const phone = document.getElementById('contactPhone'); if (phone && contact.phone) phone.textContent = contact.phone;

      const services = Array.isArray(content.services) ? content.services : [];
      if (typeof serviceDatabase !== 'undefined') {
        Object.keys(serviceDatabase).forEach(k => delete serviceDatabase[k]);
        services.forEach((s, i) => { serviceDatabase[i+1] = {title:s.title, images:(s.gallery?.length ? s.gallery : [s.image || '']), descs:(s.galleryDescriptions?.length ? s.galleryDescriptions : [s.description || ''])}; });
      }
      const serviceSlider = document.getElementById('servicesSlider');
      if (serviceSlider && services.length) serviceSlider.innerHTML = services.map((s,i) => `
        <div onclick="openServiceModal(${i+1})" class="w-[280px] sm:w-[330px] md:w-[360px] lg:w-[380px] shrink-0 snap-start bg-brandCardBg rounded-2xl overflow-hidden border border-brandBorder hover-lift shadow-md cursor-pointer group">
          <div class="h-44 sm:h-48 bg-brandDarkBg relative border-b border-brandBorder overflow-hidden">${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.style.display='none'">` : '<div class="w-full h-full flex items-center justify-center"><i class="fa-regular fa-image text-3xl text-brandGold/30"></i></div>'}</div>
          <div class="p-5 sm:p-6 space-y-2.5"><h3 class="text-lg font-bold text-brandTextPrimary group-hover:text-brandGold transition-colors">${esc(s.title)}</h3><p class="text-brandTextSecondary text-xs sm:text-sm leading-relaxed">${esc(s.description)}</p><span class="text-[11px] sm:text-xs font-bold text-brandGold flex items-center gap-1 pt-1">Read More <i class="fa-solid fa-arrow-right text-[10px]"></i></span></div>
        </div>`).join('');

      const events = Array.isArray(content.events) ? content.events : [];
      if (typeof eventDatabase !== 'undefined') {
        Object.keys(eventDatabase).forEach(k => delete eventDatabase[k]);
        events.forEach((e,i) => { eventDatabase[i+1] = {title:e.title, date:niceDate(e.date), images:(e.gallery?.length ? e.gallery : [e.image || '']), desc:e.description || ''}; });
      }
      const eventSlider = document.getElementById('timelinesSlider');
      if (eventSlider && events.length) eventSlider.innerHTML = events.map((e,i) => `
        <div onclick="openEventModal(${i+1})" class="w-[280px] sm:w-[330px] md:w-[360px] lg:w-[380px] shrink-0 snap-start bg-brandCardBg rounded-2xl overflow-hidden border border-brandBorder hover-lift shadow-md cursor-pointer group">
          <div class="h-44 sm:h-48 bg-brandDarkBg flex items-center justify-center text-brandTextSecondary text-xs relative border-b border-brandBorder overflow-hidden">${e.image ? `<img src="${esc(e.image)}" alt="${esc(e.title)}" class="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" onerror="this.style.display='none'">` : '<i class="fa-regular fa-image text-3xl text-brandGold/30"></i>'}<span class="absolute bottom-3 left-3 bg-white border border-brandBorder text-brandGold text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider shadow-sm z-10">${esc(niceDate(e.date))}</span></div>
          <div class="p-5 sm:p-6 space-y-2.5"><h3 class="text-base sm:text-lg font-bold text-brandTextPrimary group-hover:text-brandGold transition-colors">${esc(e.title)}</h3><p class="text-brandTextSecondary text-xs sm:text-sm leading-relaxed line-clamp-3">${esc(e.description || '')}</p><span class="text-[11px] sm:text-xs font-bold text-brandGold">View Event Details →</span></div>
        </div>`).join('');
    } catch (error) { console.error('Could not load published website content.', error); }
  }
  document.addEventListener('DOMContentLoaded', loadContent);
})();
