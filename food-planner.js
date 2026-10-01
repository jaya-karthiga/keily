(()=>{
  const wellbeing=document.querySelector('#wellbeing');
  if(!wellbeing||document.querySelector('#foodPlanner'))return;

  const profile=()=>{try{return JSON.parse(localStorage.getItem('jarvisUser')||'{}')}catch{return {}}};
  const commonAllergies=['Peanuts','Tree nuts','Milk / dairy','Egg','Wheat / gluten','Soy','Sesame','Fish','Shellfish'];
  const symptomChoices=['Cramps','Bloating','Nausea','Low energy','Headache','Other'];
  let chart=[
    {slot:'Morning',name:'Banana and oat porridge',ingredients:['Oats','Banana','Water'],allergens:['oats'],diets:['vegan','vegetarian','omnivore']},
    {slot:'Afternoon',name:'Vegetable moong dal khichdi',ingredients:['Rice','Moong dal','Carrot','Peas','Spinach','Tomato'],allergens:['legumes'],diets:['vegan','vegetarian','omnivore'],ironRich:true},
    {slot:'Afternoon',name:'Chicken and vegetable rice bowl',ingredients:['Chicken','Rice','Carrot','Green beans','Spinach','Tomato'],allergens:[],diets:['omnivore'],ironRich:true},
    {slot:'Night',name:'Vegetable soup with rice',ingredients:['Rice','Potato','Carrot','Tomato'],allergens:[],diets:['vegan','vegetarian','omnivore']},
    {slot:'Night',name:'Spinach and lentil soup with rice',ingredients:['Spinach','Lentils','Tomato','Rice'],allergens:['legumes'],diets:['vegan','vegetarian','omnivore'],ironRich:true},
    {slot:'Night',name:'Paneer and vegetable bowl',ingredients:['Paneer','Rice','Spinach','Tomato'],allergens:['milk'],diets:['vegetarian','omnivore']}
  ];
  const synonyms={
    'peanut':['peanut','groundnut'], 'tree nuts':['almond','cashew','walnut','pistachio','hazelnut','pecan','brazil nut'],
    'milk / dairy':['milk','dairy','yogurt','yoghurt','paneer','cheese','butter','ghee'], 'egg':['egg'],
    'wheat / gluten':['wheat','gluten','barley','rye','semolina','suji','rava'], 'soy':['soy','soya'],
    'sesame':['sesame','til'], 'fish':['fish'], 'shellfish':['shellfish','shrimp','prawn','crab','lobster'],
    'legumes':['legume','lentil','dal','bean','pea','chickpea','moong']
  };
  const normalize=value=>String(value||'').trim().toLowerCase();
  const saved={};
  const allergies=saved.allergies||[];
  const checked=(list,value)=>list.includes(value)?'checked':'';
  const symptoms=saved.symptoms||[];
  const card=document.createElement('article');
  card.id='foodPlanner';
  card.className='food-planner card';
  card.innerHTML=`<div class="food-planner-heading"><div><p class="eyebrow">FOOD & WELLBEING</p><h3>A gentle food chart</h3><p>Preferences are stored in your account and sent to Gemini to generate meal ideas.</p></div><span class="food-private-badge">Saved to your account</span></div>
    <form id="foodPreferences" class="food-preferences">
      <fieldset><legend>What symptoms would you like to note?</legend><div class="food-choice-grid">${symptomChoices.map(item=>`<label class="food-choice"><input type="checkbox" name="symptoms" value="${item}" ${checked(symptoms,item)}><span>${item}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>Choose any known allergies</legend><div class="food-choice-grid">${commonAllergies.map(item=>`<label class="food-choice"><input type="checkbox" name="allergies" value="${item}" ${checked(allergies,item)}><span>${item}</span></label>`).join('')}</div><label class="food-custom-label">Other allergy names<input id="customAllergies" type="text" maxlength="180" placeholder="Separate with commas" value="${(saved.customAllergies||'').replace(/[&<>"']/g,'')}"></label></fieldset>
      <fieldset><legend>Which meal times should be on your chart? Tick all that apply.</legend><div class="food-choice-grid"><label class="food-choice"><input type="checkbox" name="mealSlots" value="Morning"><span>Morning</span></label><label class="food-choice"><input type="checkbox" name="mealSlots" value="Afternoon"><span>Afternoon</span></label><label class="food-choice"><input type="checkbox" name="mealSlots" value="Night"><span>Night</span></label></div></fieldset>
      <label class="food-diet-label">Food preference<select id="foodDiet"><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="omnivore">Include meat</option></select></label>
      <button class="primary small" type="submit">Save and update chart</button>
    </form>
    <p class="food-note" id="foodNote">Meal ideas are general wellbeing suggestions, not treatment. Always check ingredients and cross-contact warnings with the food provider, especially for allergies.</p>
    <div id="cycleFoodFocus" class="cycle-food-focus" aria-live="polite"></div>
    <div id="mealChart" class="meal-chart" aria-live="polite"></div>
  const header=wellbeing.querySelector('.section-head');
  if(header)header.after(card);else wellbeing.prepend(card);
  const form=card.querySelector('#foodPreferences');
  const diet=card.querySelector('#foodDiet');
  diet.value=saved.diet||'vegetarian';
  const mealChart=card.querySelector('#mealChart');
  const foodNote=card.querySelector('#foodNote');
  const cycleFocus=card.querySelector('#cycleFoodFocus');
  const apiHeaders=()=>({Authorization:`Bearer ${localStorage.getItem('keilyToken')||''}`,'Content-Type':'application/json'});
  const normalizeChartSlots=meals=>(meals||[]).map(meal=>({...meal,slot:({Breakfast:'Morning',Lunch:'Afternoon',Dinner:'Night'})[meal.slot]||meal.slot})).filter(meal=>['Morning','Afternoon','Night'].includes(meal.slot));
  const loadAccountFood=async()=>{
    try{
      const response=await fetch('/api/food-preferences',{headers:apiHeaders()});
      if(!response.ok)throw new Error('Could not load your saved food preferences.');
      const preferences=await response.json();
      form.querySelectorAll('input[name="symptoms"]').forEach(input=>input.checked=(preferences.symptoms||[]).includes(input.value));
      form.querySelectorAll('input[name="allergies"]').forEach(input=>input.checked=(preferences.allergies||[]).includes(input.value));
      form.querySelectorAll('input[name="mealSlots"]').forEach(input=>input.checked=(preferences.mealSlots||[]).includes(input.value));
      card.querySelector('#customAllergies').value=preferences.customAllergies||'';
      diet.value=preferences.diet||'vegetarian';
      render();
      if(!(preferences.mealSlots||[]).length){foodNote.textContent='Tick at least one meal time, then save to generate your food chart.';return}
      foodNote.textContent='Generating your food chart with Gemini…';
      const chartResponse=await fetch('/api/food-chart',{headers:apiHeaders()});
      const chartPayload=await chartResponse.json();
      if(!chartResponse.ok)throw new Error(chartPayload.error||'Could not generate your food chart.');
      chart=normalizeChartSlots(chartPayload.meals);
      render();
    }catch(error){foodNote.textContent=`${error.message} Save your preferences to try again.`}
  };

  const cycleStage=()=>{
    const savedUser=profile();
    if(!savedUser.period)return null;
    let safeData={};try{safeData=JSON.parse(localStorage.getItem('jarvisSafeData')||'{}')}catch{}
    const period=safeData.period||{};
    if(!period.last)return null;
    const start=new Date(`${period.last}T12:00:00`);
    if(Number.isNaN(start.getTime()))return null;
    const today=new Date();today.setHours(12,0,0,0);
    start.setHours(12,0,0,0);
    const offset=Math.floor((today-start)/86400000);
    if(offset<0)return null;
    const length=Math.max(21,Math.min(40,Number(period.length)||28));
    const day=offset%length+1;
    const phase=day<=5?'period':day>length-7?'premenstrual':'between';
    return {day,length,phase};
  };

  function allergiesFromForm(){
    const selected=[...form.querySelectorAll('input[name="allergies"]:checked')].map(input=>input.value);
    const custom=card.querySelector('#customAllergies').value.split(',').map(normalize).filter(Boolean);
    return [...new Set([...selected,...custom])];
  }
  const safeForAllergy=meal=>{
    const searchable=normalize([...meal.ingredients,...meal.allergens].join(' '));
    return !allergiesFromForm().some(item=>{
      const key=normalize(item),words=synonyms[key]||[key];
      return words.some(word=>searchable.includes(normalize(word)));
    });
  };
  const render=()=>{
    const selectedDiet=diet.value;
    const cycle=cycleStage();
    if(cycle?.phase==='period')cycleFocus.innerHTML=`<b>Estimated period day ${cycle.day} of ${cycle.length}</b><p>Consider including iron-containing foods such as pulses and leafy greens if they suit your diet and allergies. Pair plant sources with vitamin C foods such as tomatoes or fruit. This is general food information, not treatment.</p>`;
    else if(cycle?.phase==='premenstrual')cycleFocus.innerHTML=`<b>Estimated days before your next period</b><p>If appetite changes, a balanced diet and smaller regular meals may suit some people. Use the chart as flexible ideas and choose what feels comfortable.</p>`;
    else if(cycle)cycleFocus.innerHTML=`<b>Estimated cycle day ${cycle.day} of ${cycle.length}</b><p>There is no special food requirement for this estimated stage. Use the chart for varied, balanced meal ideas.</p>`;
    else cycleFocus.innerHTML=`<b>Want cycle-aware notes?</b><p>Save a recent period start date and cycle length in the optional period tools. The estimate can be off if your cycle varies.</p>`;
    const slots=[...form.querySelectorAll('input[name="mealSlots"]:checked')].map(input=>input.value);
    mealChart.innerHTML=slots.map(slot=>{
      const options=chart.filter(meal=>meal.slot===slot&&meal.diets.includes(selectedDiet)&&safeForAllergy(meal));
      if(cycle?.phase==='period')options.sort((a,b)=>Number(!!b.ironRich)-Number(!!a.ironRich));
      return `<section class="meal-slot"><h4>${slot}</h4>${options.length?options.map(meal=>`<article class="meal-suggestion"><b>${meal.name}</b>${cycle?.phase==='period'&&meal.ironRich?'<em>Contains iron-rich ingredients</em>':''}<small>Ingredients: ${meal.ingredients.join(', ')}</small></article>`).join(''):'<p class="no-meal">No chart idea passes your current filters for this meal. Check your allergy list or choose another food preference.</p>'}</section>`;
    }).join('');
    const selectedSymptoms=[...form.querySelectorAll('input[name="symptoms"]:checked')].map(input=>input.value);
    foodNote.textContent=selectedSymptoms.length?`Noted: ${selectedSymptoms.join(', ')}. These are general meal ideas, not symptom treatment. Check ingredients and cross-contact warnings with the food provider, especially for allergies.`:'Meal ideas are general wellbeing suggestions, not treatment. Always check ingredients and cross-contact warnings with the food provider, especially for allergies.';
  };
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const mealSlots=[...form.querySelectorAll('input[name="mealSlots"]:checked')].map(input=>input.value);
    if(!mealSlots.length){foodNote.textContent='Tick at least one meal time for your chart.';return}
    const preferences={symptoms:[...form.querySelectorAll('input[name="symptoms"]:checked')].map(input=>input.value),allergies:allergiesFromForm(),customAllergies:card.querySelector('#customAllergies').value,diet:diet.value,mealSlots};
    const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Saving…';
    try{const response=await fetch('/api/food-preferences',{method:'PUT',headers:apiHeaders(),body:JSON.stringify(preferences)});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Could not save your preferences.');foodNote.textContent='Preferences saved to your account. Generating an updated chart with Gemini…';const chartResponse=await fetch('/api/food-chart',{headers:apiHeaders()});const chartPayload=await chartResponse.json();if(!chartResponse.ok)throw new Error(chartPayload.error||'Preferences were saved, but Gemini could not generate the chart.');chart=normalizeChartSlots(chartPayload.meals);render();button.textContent='Saved ✓';setTimeout(()=>{button.textContent='Save and update chart';button.disabled=false},1500)}catch(error){foodNote.textContent=error.message;button.textContent='Try saving again';button.disabled=false}
  });
  diet.addEventListener('change',render);
  form.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener('change',render));
  card.querySelector('#customAllergies').addEventListener('input',render);
  document.querySelector('#periodForm')?.addEventListener('submit',()=>setTimeout(render,0));
  render();
  loadAccountFood();
})();
