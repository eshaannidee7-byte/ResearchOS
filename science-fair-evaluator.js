window.generateOutreachDraft = async function() {
  const compose = workspace.querySelector('.outreach-compose');
  if (!compose) return;
  const selects = compose.querySelectorAll('select');
  const recipient = selects[0].value;
  const connection = selects[1].value;
  const request = compose.querySelector('textarea').value.trim() || 'ask for a short conversation about an appropriate validation strategy';
  const senderName = compose.querySelector('#senderName')?.value.trim() || 'a student researcher';
  const senderRole = compose.querySelector('#senderRole')?.value.trim() || 'student researcher';
  const button = compose.querySelector('.primary');
  button.innerHTML = '◌ Drafting a thoughtful note…'; button.disabled = true;
  const fallback = `Subject: Question about ${connection}\n\nDear ${recipient.split(' — ')[0]},\n\nMy name is ${senderName}, and I am a ${senderRole} developing a research project on CXCL13 in Luminal A breast tumors. I came across your work because it connects directly to ${connection}.\n\nI am reaching out to ${request.replace(/[.!?]$/,'')}. I would be especially grateful for your perspective on how a student-led project could frame this question rigorously and avoid overinterpreting the evidence.\n\nIf you have availability for a brief conversation—or could point me to a paper, protocol, or resource that would strengthen the design—I would sincerely appreciate it.\n\nThank you for considering my request,\n${senderName}`;
  let draft = fallback, source = 'Research Copilot draft';
  if (window.DISCOVERYAI_OUTREACH_ENDPOINT) {
    try {
      const response = await fetch(window.DISCOVERYAI_OUTREACH_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({recipient,connection,request,senderName,senderRole})});
      const data = await response.json();
      if (response.ok && typeof data.draft === 'string' && data.draft.trim()) { draft=data.draft.trim(); source='LLM-powered draft'; } else throw new Error('Invalid draft response');
    } catch { showToast('LLM endpoint unavailable','Using a high-quality local draft. Check the configured server endpoint.'); }
  }
  setTimeout(() => {
    const preview = workspace.querySelector('.draft-preview');
    preview.querySelector('h2').textContent = `Subject: ${draft.split('\n')[0].replace(/^Subject:\s*/i,'')}`;
    let body = preview.querySelector('.generated-draft');
    if (!body) { body=document.createElement('div'); body.className='generated-draft'; preview.querySelector('.draft-label').after(body); }
    body.innerHTML = draft.split('\n').slice(1).filter(Boolean).map(p=>`<p>${p}</p>`).join('');
    preview.querySelectorAll(':scope > p').forEach(p=>p.style.display='none');
    button.disabled=false; button.innerHTML='✦ Generate thoughtful draft';
    showToast(source,'The email was newly composed from your profile, connection, and request.');
  }, 0);
};

function gradeScienceFairStrict(text) {
  const words=text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 35) return showToast('Abstract is too short','Add at least 35 words before requesting a science-fair evaluation.');
  const lower=` ${text.toLowerCase()} `, has=r=>r.test(lower);
  const background=(has(/\b(problem|challenge|gap|limited|unknown|despite|however)\b/)?5:0)+(has(/\b(health|disease|environment|energy|risk|outcome|impact|cost)\b/)?3:0)+(words.length<=350?2:1);
  const objective=(has(/\b(aim|objective|purpose|hypothesis|research question|we investigated|we tested|we examined)\b/)?10:0)+(has(/\b(whether|effect|association|predict|compare|relationship|difference)\b/)?5:0);
  const methodParts=[has(/\b(dataset|cohort|participants|patients|samples|subjects|mice|cells|records)\b/),has(/\b(n\s*=|\d+ (samples|participants|patients|mice|cells|records))\b/),has(/\b(control|baseline|comparison group|randomi[sz]|blind)\b/),has(/\b(assay|pcr|sequenc|microscope|protocol|instrument|laboratory)\b/),has(/\b(python|r\b|matlab|spss|algorithm|model|software)\b/),has(/\b(cross.validation|train.test|validation set|bootstrap|replicat)\b/),has(/\b(regression|t.test|anova|chi.square|statistical test)\b/)];
  const methodology=Math.min(30,methodParts.filter(Boolean).length*4+(has(/\b(preprocess|normalize|cleaned|feature)\b/)?2:0));
  const resultParts=[has(/\b\d+(?:\.\d+)?%\b/),has(/\bp\s*[<=>]\s*0?\.\d+\b/),has(/\b(confidence interval|auc|f1|precision|recall|accuracy|sensitivity|specificity|effect size|odds ratio)\b/),has(/\b(compared with|versus|baseline|outperformed|higher than|lower than)\b/),has(/\b(found|observed|showed|demonstrated|associated)\b/)];
  const results=Math.min(30,resultParts.filter(Boolean).length*6);
  const overclaim=has(/\b(revolutionize|prove|cure|guarantee|all patients|always)\b/);
  const conclusion=(results>=12&&has(/\b(suggest|indicate|support|may|could)\b/)?4:0)+(has(/\b(limit|limitation|future work|validate|further research|replicate)\b/)?4:0)+(!overclaim?2:0);
  const vague=['really','lots of','many','some','several','around','kind of','very effective','worked well','successful'].filter(x=>lower.includes(` ${x} `));
  const sentenceCount=text.split(/[.!?]+/).filter(Boolean).length;
  const clarity=Math.min(5,(sentenceCount>=3?2:1)+(words.length/(sentenceCount||1)<=32?2:1)+(vague.length?0:1));
  const rubric=[['Background',background,10],['Objective',objective,15],['Methodology',methodology,30],['Results',results,30],['Conclusion',conclusion,10],['Clarity',clarity,5]];
  const deductions=[]; let score=rubric.reduce((s,x)=>s+x[1],0);
  if(vague.length){const d=Math.min(8,vague.length*2);score-=d;deductions.push(`−${d}: vague wording (${vague.join(', ')}).`);}
  if(methodology<12){score-=6;deductions.push('−6: methodology lacks reproducible detail.');}
  if(results<12){score-=7;deductions.push('−7: quantitative results or metrics are missing.');}
  if(!methodParts[0]||!methodParts[1]){score-=4;deductions.push('−4: dataset/subjects or sample size is not explicit.');}
  if(overclaim){score-=5;deductions.push('−5: conclusion extends beyond the stated evidence.');}
  if(conclusion<6){score-=2;deductions.push('−2: no explicit limitation or grounded future work.');}
  score=Math.max(0,Math.round(score)); if(methodology<18||results<18)score=Math.min(score,60); if(methodology<12&&results<12)score=Math.min(score,45); if(background<5&&objective<10&&methodology<12)score=Math.min(score,39); if(objective===15&&methodology>=26&&results>=26&&conclusion>=7)score=Math.max(score,90);
  const evidence=[['Background',background>=5,background>=5?'Specific problem or motivation is stated.':'No concise, relevant motivation is explicit.'],['Objective',objective===15,'An explicit objective/hypothesis is required for full credit.'],['Methodology',methodology>=24,`Explicit method details: ${methodParts.filter(Boolean).length} of 7 key categories.`],['Results',results>=24,`Quantitative-result signals: ${resultParts.filter(Boolean).length} of 5.`],['Conclusion',conclusion>=7,overclaim?'Overclaiming language is present.':'Conclusion needs a stated limitation and support from results.']];
  const strengths=evidence.filter(x=>x[1]).map(x=>`${x[0]}: ${x[2]}`); const weak=evidence.filter(x=>!x[1]).map(x=>`${x[0]}: ${x[2]}`); const missing=[!methodParts[0]&&'dataset or subject description',!methodParts[1]&&'sample size',methodology<18&&'specific design, procedures, tools, and validation strategy',results<18&&'exact quantitative findings, metrics, or baseline comparison',conclusion<6&&'limitations and grounded future work'].filter(Boolean);
  const summary=score>=80?'The abstract contains unusually complete explicit scientific evidence. The score reflects the stated methods and results, not confidence or writing polish.':score>=60?'The abstract has a recognizable research story, but missing scientific details limit rigorous evaluation.': 'The abstract does not provide enough explicit methodological or quantitative evidence for a strong science-fair score.';
  workspace.querySelector('#abstractScore').textContent=score; workspace.querySelector('#scoreLabel').textContent=score>=90?'Exceptional scientific abstract':score>=80?'Good abstract with strong evidence':score>=65?'Average abstract—important gaps remain':'Scientifically incomplete abstract'; workspace.querySelector('#scoreSummary').textContent=summary;
  workspace.querySelector('#scoreBreakdown').innerHTML=`<div class="judge-report"><h3>Evidence by Rubric Section</h3>${evidence.map(x=>`<p><b>${x[0]}:</b> ${x[2]}</p>`).join('')}<h3>Rubric Breakdown</h3>${rubric.map(x=>`<div class="grade-row"><span>${x[0]}</span><b>${x[1]}/${x[2]}</b><i style="width:${x[1]/x[2]*100}%"></i></div>`).join('')}<h3>Every Deduction</h3><ul>${(deductions.length?deductions:['No automatic deductions triggered.']).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Top Strengths</h3><ul>${(strengths.length?strengths:['No strength is sufficiently explicit to verify.']).map(x=>`<li>${x}</li>`).join('')}</ul><h3>Major Weaknesses</h3><ul>${weak.map(x=>`<li>${x}</li>`).join('')}</ul><h3>Missing Information</h3><ul>${missing.map(x=>`<li>${x}</li>`).join('')}</ul><h3>Three Concrete Improvements</h3><ol><li>State the objective or hypothesis in one explicit sentence.</li><li>List the dataset/subjects, n, design, procedures, and validation or statistical test.</li><li>Report exact results: metric or effect size, comparison, and p-value/CI when applicable.</li></ol><h3>Judge’s Summary</h3><p>${summary}</p></div>`;
  showToast('Science fair evaluation complete',`${score}/100 — evidence-only strict rubric.`);
}
