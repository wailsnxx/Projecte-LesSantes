/* Chatbot Les Santes  */
(function () {
    'use strict';

    var EVENTS_URL    = 'actes_santes_2025_pia.json';
    var events        = null;
    var welcomed      = false;
    var festivalRange = null;

    /* Categories */
    var CATS = {
        families: {
            label: 'Famílies',
            kw: ['infantil','familiar','nens','nins','familia','criatures','petits','joc','jocs',
                 'canalla','tallers','taller','activitat','activitats'],
            ambits: ['infantil','familiar','activitat familiar','activitats infantils',
                     'activitats familiars','jocs']
        },
        concerts: {
            label: 'Concerts',
            kw: ['concert','musica','coral','orquestra','banda','gospel','jazz','rock','folk',
                 'cantata','actuacio','cantant','grups','musicals','cant','canta','musical'],
            ambits: ['concerts','musica','concerts i espectacles','espectacles musicals']
        },
        foc: {
            label: 'Foc',
            kw: ['foc','diables','correfoc','castell','pirotecnia','bestiari','diablesses',
                 'focs','dracs','traca','espurnes','gegantons','bestiari'],
            ambits: ['foc','actes de foc','bestiari','correfoc','pirotecnia']
        }
    };

    /* Sinònims per ampliar la cerca */
    var SYNONYMS = {
        'musica':    ['concert','actuacio','jazz','rock','gospel','coral','banda','orquestra','cantata'],
        'concert':   ['musica','actuacio','coral','banda'],
        'actuacio':  ['concert','musica','espectacle'],
        'nens':      ['familiar','infantil','canalla','criatures','joc'],
        'canalla':   ['familiar','infantil','nens','joc','taller'],
        'infants':   ['familiar','infantil','nens','canalla'],
        'criatures': ['familiar','infantil','nens','canalla'],
        'familia':   ['familiar','infantil','nens','canalla'],
        'foc':       ['correfoc','diables','bestiari','pirotecnia','dracs'],
        'diables':   ['foc','correfoc','bestiari','diablesses'],
        'correfoc':  ['foc','diables','bestiari','pirotecnia'],
        'ball':      ['dansa','sardana','sardanes','danses'],
        'teatre':    ['espectacle','actuacio','dramatica'],
        'exposicio': ['exposicions','mostra','museu'],
        'museu':     ['exposicions','mostra','exposicio'],
        'gegants':   ['bestiari','gegantons','capgrossos'],
        'sardana':   ['ball','dansa','cobla'],
        'taller':    ['tallers','activitat','familiar','infantil'],
        'desvetllar':['desvetllament'],
        'festa':     ['les santes','santes','mataronina'],
        'havaneres': ['havanera','mar','cant','musica'],
        'cercavila': ['gegants','bestiari','desfile','passada'],
        'passada':   ['cercavila','gegants','bestiari']
    };

    /* Mapa de dies de la setmana (català + castellà) */
    var DAY_MAP = {
        'dilluns':   'dilluns',   'lunes':     'dilluns',
        'dimarts':   'dimarts',   'martes':    'dimarts',
        'dimecres':  'dimecres',  'miercoles': 'dimecres',
        'dijous':    'dijous',    'jueves':    'dijous',
        'divendres': 'divendres', 'viernes':   'divendres',
        'dissabte':  'dissabte',  'sabado':    'dissabte',
        'diumenge':  'diumenge',  'domingo':   'diumenge'
    };

    /* Expandeix paraules de cerca amb sinònims */
    function expandWords(words) {
        var out = words.slice();
        words.forEach(function(w) {
            if (SYNONYMS[w]) {
                SYNONYMS[w].forEach(function(s) {
                    if (out.indexOf(s) === -1) out.push(s);
                });
            }
        });
        return out;
    }

    /* Puntua la rellevància d'un acte per a unes paraules de cerca */
    function scoreEvent(e, words) {
        var nTitle    = n(e.title    || '');
        var nPretitle = n(e.pretitle || '');
        var nLocation = n(e.location || '');
        var nDate     = n(e.date_to_ca_detail || '');
        var nAmbits   = n((e.ambits  || []).map(function(a){ return a.name; }).join(' '));
        var nDesc     = n((e.description_short || '').replace(/<[^>]*>/g, ' '));
        var score = 0;

        words.forEach(function(w) {
            if (w.length < 2) return;
            if (nTitle.includes(w))    score += 10;
            if (nPretitle.includes(w)) score +=  7;
            if (nAmbits.includes(w))   score +=  6;
            if (nLocation.includes(w)) score +=  5;
            if (nDate.includes(w))     score +=  4;
            if (nDesc.includes(w))     score +=  2;
        });

        /* Bonus per concordança exacta de frase en el títol */
        if (words.length > 1 && nTitle.includes(words.join(' '))) score += 20;

        return score;
    }

    /* Ordenació per puntuació i retorn dels actes */
    function topResults(list) {
        return list.slice().sort(function(a, b){ return b.s - a.s; })
                   .map(function(x){ return x.e; });
    }

    /* DOM */
    var panel, msgs, input, sendBtn, fab;

    /*Normalitza text per a cerca */
    function n(s) {
        return (s || '').toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    /* Text indexable d'un acte */
    function idx(e) {
        return [
            e.title, e.pretitle, e.location,
            e.date_to_ca_detail,
            (e.description_short || '').replace(/<[^>]*>/g, ' '),
            (e.ambits || []).map(function(a){ return a.name; }).join(' ')
        ].map(n).join(' ');
    }

    /*  Init */
    function init() {
        fab      = document.querySelector('.fab');
        panel    = document.getElementById('chatbotPanel');
        msgs     = document.getElementById('cbMessages');
        input    = document.getElementById('cbInput');
        sendBtn  = document.getElementById('cbSend');
        var closeBtn = document.getElementById('closeChatbot');

        if (!panel) return;

        var resetBtn = document.getElementById('resetChatbot');

        if (fab)      fab.addEventListener('click', open);
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (resetBtn) resetBtn.addEventListener('click', reset);
        if (sendBtn)  sendBtn.addEventListener('click', send);
        if (input)    input.addEventListener('keydown', function(e){ if (e.key === 'Enter') send(); });

        document.querySelectorAll('.cb-tab').forEach(function(t) {
            t.addEventListener('click', function() {
                setTab(t);
                onTab(t.dataset.category);
            });
        });
    }

    /*  Obre / tanca  */
    function open() {
        panel.classList.add('cb-visible');
        requestAnimationFrame(function(){ panel.classList.add('open'); });
        if (fab) fab.style.display = 'none';
        if (!welcomed) {
            if (!events) { loadJSON().then(welcome); }
            else          { welcome(); }
        }
    }
    function close() {
        panel.classList.remove('open');
        setTimeout(function(){ panel.classList.remove('cb-visible'); }, 230);
        if (fab) fab.style.display = 'flex';
    }
    function reset() {
        clear();
        if (!events) { loadJSON().then(welcome); }
        else          { welcome(); }
    }

    /* Carrega JSON  */
    function loadJSON() {
        return fetch(EVENTS_URL)
            .then(function(r){ return r.json(); })
            .then(function(d){
                events = d.events || d;
                var days = events.map(function(e){
                    var m = (e.date_initial || '').match(/^(\d{2})\.07/);
                    return m ? parseInt(m[1]) : null;
                }).filter(function(x){ return x !== null; });
                if (days.length) {
                    festivalRange = {
                        min: Math.min.apply(null, days),
                        max: Math.max.apply(null, days)
                    };
                }
            })
            .catch(function(){ events = []; });
    }

    /* Pantalla 1: Benvinguda */
    function welcome() {
        welcomed = true;
        bot('Hola! Soc el Chatbot Les Santes 🧡');
        bot('Tota la informació prové de la programació oficial. Pregunta\'m el que vulguis!');
        quickBtns([
            { icon:'🌙', title:'On és el Desvetllament?', sub:'Horari i lloc',        action:'desvetllament' },
            { icon:'🔥', title:'Correfoc de focs',        sub:'On i quan',            action:'correfoc'      },
            { icon:'👨‍👩‍👧', title:'Activitats nens',       sub:'Programació infantil', action:'families'      },
            { icon:'📅', title:'Actes del 27',            sub:'Dia de Les Santes',    action:'dia27'         },
        ]);
    }

    /* Tab click */
    function onTab(cat) {
        clear();
        if (cat === 'all') { welcome(); return; }
        typing();
        setTimeout(function(){
            stopTyping();
            if (!events) { loadJSON().then(function(){ byCat(cat); }); }
            else          { byCat(cat); }
        }, 500);
    }

    /* Cerca per categoria (amb puntuació) */
    function byCat(cat) {
        var def = CATS[cat];
        if (!def || !events) return;
        var catWords = def.kw.concat(def.ambits);
        var scored = events.map(function(e) {
            return { e: e, s: scoreEvent(e, catWords) };
        }).filter(function(x){ return x.s > 0; });

        if (!scored.length) {
            bot('No he trobat cap acte de «' + def.label + '» a la programació.');
            return;
        }
        var res = topResults(scored);
        var label = cat === 'concerts'
            ? 'He trobat ' + res.length + ' concerts i actes musicals:'
            : 'He trobat ' + res.length + ' actes de ' + def.label.toLowerCase() + ':';
        bot(label);
        cards(res, 2);
    }

    /* Cerca per text lliure */
    function send() {
        var q = (input.value || '').trim();
        if (!q) return;
        input.value = '';
        user(q);
        typing();
        setTimeout(function(){
            stopTyping();
            if (!events) { loadJSON().then(function(){ search(q); }); }
            else          { search(q); }
        }, 600);
    }

    function search(q) {
        var nq   = n(q);
        var raw  = nq.split(/\s+/).filter(function(w){ return w.length > 1; });
        if (!raw.length) {
            bot('Escriu el nom d\'un acte, un lloc o una data.');
            return;
        }

        /* Detecció d'intencions clares → redirigeix */
        if (/\b(concert|concerts|musica|musical|actuaci[oó]|concierto|conciertos)\b/.test(nq)) { byCat('concerts'); return; }
        if (/\b(familiar|famil[ei]|nens|canalla|infants|infantil|ni[nñ]os|ninos|familia)\b/.test(nq)) { byCat('families'); return; }
        if (/\b(foc|correfoc|diables|bestiari|pirotecnia|fuego|diablos)\b/.test(nq)) { byCat('foc'); return; }
        if (/desvetllament/.test(nq)) { byKw('desvetllament','Actes del Desvetllament:'); return; }
        if (/dia\s+de\s+les\s+santes|vint-i-set/.test(nq)) { byDayNum(27); return; }

        /* Detecció de número de dia */
        var numMatch = nq.match(/(?:dia\s+|el\s+dia\s+|el\s+|del?\s+|actes\s+(?:del?\s+)?|horari\s+|programa\s+)\b(0?[1-9]|[12]\d|3[01])\b|\b(0?[1-9]|[12]\d|3[01])\b\s*(?:de\s+juliol|de\s+julio)|^(0?[1-9]|[12]\d|3[01])$/);
        if (numMatch) { byDayNum(parseInt(numMatch[1] || numMatch[2] || numMatch[3], 10)); return; }

        /* Detecció de dia de la setmana (català i castellà) */
        var dayKeys = Object.keys(DAY_MAP);
        for (var di = 0; di < dayKeys.length; di++) {
            if (nq.indexOf(dayKeys[di]) !== -1) { byDay(DAY_MAP[dayKeys[di]]); return; }
        }

        /* Cerca per puntuació amb sinònims */
        var words  = expandWords(raw);
        var scored = events.map(function(e) {
            return { e: e, s: scoreEvent(e, words) };
        }).filter(function(x){ return x.s > 0; });

        if (!scored.length) { noResults(q); return; }

        var res = topResults(scored);
        bot(res.length === 1
            ? 'He trobat un acte relacionat amb «' + q + '»:'
            : 'He trobat ' + res.length + ' actes, els més rellevants per «' + q + '»:');
        cards(res, 2);
    }

    /* Botons ràpids  */
    function action(a) {
        typing();
        setTimeout(function(){
            stopTyping();
            if (!events) { loadJSON().then(function(){ doAction(a); }); }
            else          { doAction(a); }
        }, 500);
    }

    function doAction(a) {
        switch (a) {
            case 'desvetllament': byKw('desvetllament', 'Actes del Desvetllament:'); break;
            case 'correfoc':     byKw('correfoc', 'Actes de Correfoc:');            break;
            case 'families':     byCat('families');                                  break;
            case 'dia27':        byDayNum(27);                                        break;
            case 'concerts':     byCat('concerts');                                  break;
            case 'foc':          byCat('foc');                                        break;
            default:             byKw(a, 'Actes relacionats:');
        }
    }

    function byKw(kw, intro) {
        var words  = expandWords(n(kw).split(/\s+/).filter(function(w){ return w.length > 1; }));
        var scored = events.map(function(e) {
            return { e: e, s: scoreEvent(e, words) };
        }).filter(function(x){ return x.s > 0; });
        if (!scored.length) { noResults(kw); return; }
        bot(intro);
        cards(topResults(scored), 2);
    }

    function byDayNum(day) {
        var pad   = (day < 10 ? '0' + day : String(day));
        var range = festivalRange || { min: 5, max: 29 };
        var res   = events.filter(function(e){
            return (e.date_initial || '').startsWith(pad + '.07');
        });
        if (!res.length) {
            if (day < range.min || day > range.max) {
                bot('Les Santes 2025 se celebra del ' + range.min + ' al ' + range.max +
                    ' de juliol. El dia ' + day + ' no forma part de la programació.');
            } else {
                bot('No hi ha cap acte el dia ' + day + ' de juliol a la programació.');
            }
            return;
        }
        bot('Actes del ' + day + ' de juliol (' + res.length + ' actes en total):');
        cards(res, 2);
    }

    function byDay(dayName) {
        var res = events.filter(function(e){
            return n(e.date_to_ca_detail || '').indexOf(dayName) === 0;
        });
        if (!res.length) { bot('No he trobat actes el ' + dayName + '.'); return; }
        var label = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        bot('Actes del ' + label + ' (' + res.length + ' actes):');
        cards(res, 3);
    }

    function bot(text) {
        var row = document.createElement('div');
        row.className = 'cb-msg cb-msg-bot';
        var bub = document.createElement('div');
        bub.className = 'cb-bubble';
        bub.textContent = text;
        row.appendChild(bub);
        msgs.appendChild(row);
        scroll();
    }

    function user(text) {
        var row = document.createElement('div');
        row.className = 'cb-msg cb-msg-user';
        var bub = document.createElement('div');
        bub.className = 'cb-bubble cb-bubble-user';
        bub.textContent = text;
        row.appendChild(bub);
        msgs.appendChild(row);
        scroll();
    }

    function typing() {
        var row = document.createElement('div');
        row.className = 'cb-msg cb-msg-bot cb-typing-row';
        var bub = document.createElement('div');
        bub.className = 'cb-bubble cb-typing';
        bub.innerHTML = '<span></span><span></span><span></span>';
        row.appendChild(bub);
        msgs.appendChild(row);
        scroll();
    }

    function stopTyping() {
        var t = msgs ? msgs.querySelector('.cb-typing-row') : null;
        if (t) t.parentNode.removeChild(t);
    }

    function quickBtns(opts) {
        var lbl = document.createElement('div');
        lbl.className = 'cb-section-label';
        lbl.textContent = 'Opcions ràpides';
        msgs.appendChild(lbl);

        var grid = document.createElement('div');
        grid.className = 'cb-options-grid';

        opts.forEach(function(o) {
            var btn = document.createElement('button');
            btn.className = 'cb-option-card';
            btn.type = 'button';

            var ic = document.createElement('span');
            ic.className = 'cb-opt-icon';
            ic.textContent = o.icon;

            var wrap = document.createElement('div');
            var t1 = document.createElement('div');
            t1.className = 'cb-opt-title';
            t1.textContent = o.title;
            var t2 = document.createElement('div');
            t2.className = 'cb-opt-sub';
            t2.textContent = o.sub;
            wrap.appendChild(t1);
            wrap.appendChild(t2);

            btn.appendChild(ic);
            btn.appendChild(wrap);
            btn.addEventListener('click', function(){
                user(o.title);
                action(o.action);
            });
            grid.appendChild(btn);
        });

        msgs.appendChild(grid);
        scroll();
    }

    function cards(list, max) {
        var total = list.length;
        var shown = Math.min(max, total);

        if (total > shown) {
            var cl = document.createElement('div');
            cl.className = 'cb-count-label';
            cl.textContent = 'Mostrant ' + shown + ' de ' + total + ' actes';
            msgs.appendChild(cl);
        }

        for (var i = 0; i < shown; i++) {
            msgs.appendChild(makeCard(list[i]));
        }

        if (total > shown) {
            var more = document.createElement('a');
            more.href = 'agenda.html';
            more.setAttribute('style',
                'display:block;text-align:center;margin-top:6px;' +
                'padding:9px 14px;background:#3f9fcb;color:#fff;' +
                'border-radius:20px;font-size:12px;font-weight:700;' +
                'text-decoration:none;'
            );
            more.textContent = 'Veure tots els ' + total + ' actes →';
            msgs.appendChild(more);
        }

        scroll();
    }

    function makeCard(e) {
        function safe(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        var pre = e.pretitle || (e.ambits && e.ambits[0] ? e.ambits[0].name : '') || '';
        var imgUrl = e.images && e.images.load_url ? e.images.load_url : '';
        var html = '';
        if (imgUrl) {
            html += '<div style="width:100%;height:72px;overflow:hidden;">'
                  + '<img src="' + safe(imgUrl) + '" alt="" loading="lazy"'
                  + ' style="width:100%;height:100%;object-fit:cover;display:block;">'
                  + '</div>';
        }
        html += '<div style="padding:10px 12px;">';
        if (pre) {
            html += '<div style="color:#2d7ea8;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">'
                  + safe(pre) + '</div>';
        }
        html += '<div style="color:#0d1117;font-size:13px;font-weight:700;line-height:1.35;margin-bottom:5px;">'
              + safe(e.title || '—') + '</div>';
        if (e.date_to_ca_detail) {
            html += '<div style="color:#5a8fa8;font-size:11px;margin-top:3px;">'
                  + '&#128197; ' + safe(e.date_to_ca_detail) + '</div>';
        }
        if (e.location) {
            html += '<div style="color:#5a8fa8;font-size:11px;margin-top:2px;">'
                  + '&#128205; ' + safe(e.location) + '</div>';
        }
        html += '</div>';

        var card = document.createElement('div');
        card.setAttribute('style',
            'background:#ffffff;' +
            'border:1px solid rgba(63,159,203,0.3);' +
            'border-radius:10px;' +
            'overflow:hidden;' +
            'margin-bottom:4px;' +
            'box-shadow:0 1px 6px rgba(63,159,203,0.12);'
        );
        card.innerHTML = html;
        return card;
    }

    /* Pantalla 4: Sense resultats  */
    function noResults(q) {
        var d = document.createElement('div');
        d.className = 'cb-no-results';

        var ic = document.createElement('div');
        ic.className = 'cb-no-icon';
        ic.textContent = '🔍';
        d.appendChild(ic);

        var ti = document.createElement('div');
        ti.className = 'cb-no-title';
        ti.textContent = 'No he trobat cap acte';
        d.appendChild(ti);

        var tx = document.createElement('div');
        tx.className = 'cb-no-text';
        tx.textContent = 'No puc proporcionar informació sobre «' + q + '» perquè no apareix a la programació oficial. Només treballo amb dades de la programació de Les Santes.';
        d.appendChild(tx);

        var hint = document.createElement('div');
        hint.className = 'cb-no-text';
        hint.style.marginTop = '8px';
        hint.textContent = 'Potser et pot ajudar:';
        d.appendChild(hint);

        var sugs = document.createElement('div');
        sugs.className = 'cb-suggestions';
        [
            ['Concerts',            'concerts'],
            ['Activitats familiars', 'families'],
            ['Actes de foc',         'foc'],
            ['Actes del 27 de juliol','dia27']
        ].forEach(function(s) {
            var b = document.createElement('button');
            b.className = 'cb-suggestion';
            b.type = 'button';
            b.textContent = s[0];
            b.addEventListener('click', function(){
                user(s[0]);
                action(s[1]);
            });
            sugs.appendChild(b);
        });
        d.appendChild(sugs);
        msgs.appendChild(d);
        scroll();
    }

    /* Utilitats  */
    function scroll() {
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }
    function clear() {
        if (msgs) msgs.innerHTML = '';
        welcomed = false;
    }
    function setTab(t) {
        document.querySelectorAll('.cb-tab').forEach(function(x){ x.classList.remove('active'); });
        t.classList.add('active');
    }

    /* Arrencada*/
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
