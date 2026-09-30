(()=>{
  const account=document.querySelector('.settings-grid .settings-panel:first-child');
  if(!account)return;
  const doodle=(bg,art)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${bg}"/><g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`)}`;
  const avatars={
    flower:doodle('#e878a5','<path d="M50 23c8-14 20-5 13 6 14-7 22 5 7 13 16 2 13 17-3 17 9 13-3 23-14 11-8 14-21 5-13-7-15 7-22-6-7-14-16-2-12-17 4-17-8-14 4-22 13-9z"/><circle cx="50" cy="49" r="9"/><path d="M50 59v21m0-10-12-7m12 13 12-8"/>'),
    cat:doodle('#687ed8','<path d="m27 40 3-20 17 13h8l17-13 3 20a31 31 0 1 1-48 0z"/><path d="M39 48h1m20 0h1M42 60c5 5 11 5 16 0m-17-5-14-2m14 7-13 3m31-8 14-2m-14 7 13 3"/>'),
    sun:doodle('#ed9a4d','<circle cx="50" cy="52" r="20"/><path d="M50 14v9m0 58v8M12 52h9m58 0h9M23 25l7 7m40 40 7 7m0-54-7 7m-40 40-7 7"/><path d="M42 50h1m14 0h1m-16 10c5 5 11 5 16 0"/>'),
    moon:doodle('#8068cb','<path d="M66 18a33 33 0 1 0 17 47A35 35 0 0 1 66 18z"/><path d="m27 30 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zm48 22 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/>'),
    leaf:doodle('#35ac8d','<path d="M77 20C42 20 22 34 23 57c1 16 14 25 28 18 18-10 23-34 26-55z"/><path d="M22 81c11-21 24-34 48-51M39 63l-1-16m14 4 15-2"/>'),
    butterfly:doodle('#d96e9f','<path d="M49 49C31 19 13 27 19 49c3 11 14 13 29 5-18 4-24 18-14 25 9 7 19-4 17-25 2 21 12 32 21 25 10-7 4-21-14-25 15 8 26 6 29-5 6-22-12-30-30 0z"/><path d="M50 35v37m0-36-8-11m8 11 8-11"/>')
  };
  const user=()=>{try{return JSON.parse(localStorage.getItem('jarvisUser')||'{}')}catch{return {}}};
  const key=()=>`keilyProfileAvatar:${user().id||'guest'}`;
  const source=value=>value?.startsWith('doodle:')?avatars[value.slice(7)]||avatars.flower:value||avatars.flower;
  const current=()=>localStorage.getItem(key())||'doodle:flower';
  const profile=user();
  const choices=Object.entries(avatars).map(([id,src])=>`<button type="button" class="profile-doodle" data-profile-doodle="${id}" aria-label="Choose ${id} doodle"><img src="${src}" alt=""></button>`).join('');
  account.classList.add('account-panel');
  account.innerHTML=`<div class="account-avatar-stack"><img id="profileAvatarPreview" class="account-avatar-preview" alt="Your profile picture"><label class="avatar-upload" for="profileAvatarUpload">Upload photo</label><input id="profileAvatarUpload" class="avatar-upload-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div><div class="account-info"><p class="eyebrow">ACCOUNT</p><h3 id="settingsName">${(profile.name||'Your account').replace(/[&<>"']/g,'')}</h3><p id="settingsId">@${(profile.id||'').replace(/[&<>"']/g,'')}</p><p id="settingsGender">${profile.gender?`Gender: ${String(profile.gender).replace(/[&<>"']/g,'')}`:'Gender: Prefer not to say'}</p><p class="account-avatar-note">Choose a doodle or upload a photo. It stays on this device.</p><div class="profile-doodles" role="group" aria-label="Choose a doodle profile picture">${choices}</div></div>`;
  const apply=()=>{
    const src=source(current()),preview=document.querySelector('#profileAvatarPreview'),avatar=document.querySelector('#avatar');
    if(preview)preview.src=src;
    if(avatar){avatar.textContent='';avatar.style.backgroundImage=`url("${src}")`;avatar.style.backgroundSize='cover';avatar.style.backgroundPosition='center';avatar.setAttribute('aria-label','Profile picture')}
    document.querySelectorAll('[data-profile-doodle]').forEach(button=>button.classList.toggle('active',current()===`doodle:${button.dataset.profileDoodle}`));
  };
  const save=value=>{try{localStorage.setItem(key(),value);apply()}catch{alert('This photo could not be saved. Please choose a smaller image.')}};
  document.querySelectorAll('[data-profile-doodle]').forEach(button=>button.addEventListener('click',()=>save(`doodle:${button.dataset.profileDoodle}`)));
  document.querySelector('#profileAvatarUpload')?.addEventListener('change',event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(!file.type.startsWith('image/')){alert('Please choose an image file.');return}
    const reader=new FileReader();reader.onerror=()=>alert('That image could not be opened. Please try another one.');
    reader.onload=()=>{const image=new Image();image.onerror=()=>alert('That image could not be opened. Please try another one.');image.onload=()=>{const size=256,side=Math.min(image.width,image.height),canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;canvas.getContext('2d').drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,size,size);save(canvas.toDataURL('image/jpeg',.84))};image.src=reader.result};reader.readAsDataURL(file);
  });
  window.applyKeilyProfileAvatar=apply;
  const enter=window.enter;
  if(typeof enter==='function')window.enter=function(...args){const result=enter.apply(this,args);apply();return result};
  apply();
})();
