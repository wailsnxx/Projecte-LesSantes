// Ens assegurem que l'HTML s'ha carregat completament abans d'executar res
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seleccionem els elements que interactuaran
    const fabButton = document.querySelector('.fab');
    const chatbotPanel = document.getElementById('chatbotPanel');
    const closeBtn = document.getElementById('closeChatbot');

    // 2. Comprovem que el botó i el panell existeixen a la pàgina
    if (fabButton && chatbotPanel) {
        // Acció per OBRIR el xatbot
        fabButton.addEventListener('click', () => {
            chatbotPanel.classList.add('open');
            // Opcional: Podem amagar el botó flotant quan el xatbot està obert
            fabButton.style.display = 'none'; 
        });
    }

    // 3. Comprovem que el botó de tancar existeix
    if (closeBtn && chatbotPanel) {
        // Acció per TANCAR el xatbot
        closeBtn.addEventListener('click', () => {
            chatbotPanel.classList.remove('open');
            // Si havíem amagat el botó flotant, el tornem a mostrar
            if (fabButton) {
                fabButton.style.display = 'flex';
            }
        });
    }
});

// =============================================================================
// LA RUTA DE LES SANTES — Joc de cartes estratègic
// Prefix ms-cg- — evita col·lisions amb l'espai global
// =============================================================================
(function () {
    'use strict';

    // ── Definició de les etapes ──────────────────────────────────────────────
    var STAGES = [
        { id:1, name:'El Pregó',          sub:"L'inici oficial de la festa",        target:35 },
        { id:2, name:'La Cercavila',       sub:'El seguici pels carrers de Mataró',   target:55 },
        { id:3, name:'Ball de Gegants',    sub:"La plaça gran s'omple de vida",       target:75 },
        { id:4, name:'La Gran Final',      sub:"L'espectacle que ho corona tot",      target:95 },
    ];

    // ── Catàleg de cartes (14 cartes) ────────────────────────────────────────
    // Types: PERSONATGE / MUSICA / TRADICIO / FESTA
    var CARDS = [
        // PERSONATGE — vermell #c23030
        { id:1,  name:'Robafaves',        type:'PERSONATGE', pts:22, desc:'El gran protagonista de Les Santes. La seva presència omple els carrers.' },
        { id:2,  name:'La Geganta',       type:'PERSONATGE', pts:19, desc:'Majestuosa i serena, dansa pels carrers de Mataró.' },
        { id:3,  name:'Toneta',           type:'PERSONATGE', pts:16, desc:"La petita del seguici. Estimada per tots els infants de la città." },
        { id:4,  name:'Maneló',           type:'PERSONATGE', pts:14, desc:'Ple d\'energia i humor. Fa riure tothom allà on va.' },
        // MÚSICA — blau #1e5fa8
        { id:5,  name:'Tabalada',         type:'MUSICA', pts:21, desc:'El ritme del tabaler marca el pas del seguici.' },
        { id:6,  name:'Les Gralles',      type:'MUSICA', pts:17, desc:'El so de les gralles anuncia que la festa ha començat.' },
        { id:7,  name:'El Cornet',        type:'MUSICA', pts:13, desc:'La trompeta obri el camí de la cercavila.' },
        // TRADICIÓ — daurat #a87820
        { id:8,  name:'Cercavila',        type:'TRADICIO', pts:20, desc:'Tot el seguici festiu recorre els carrers de la ciutat.' },
        { id:9,  name:'Ball de Gegants',  type:'TRADICIO', pts:18, desc:'El moment més esperat: els gegants dansen a la plaça.' },
        { id:10, name:'Castellers',       type:'TRADICIO', pts:15, desc:'La torre humana: força, equilibri i coratge.' },
        // FESTA — verd #1e6b3a
        { id:11, name:'Confeti',          type:'FESTA', pts:11, desc:'Una allau de colors baixa del cel sobre la multitud.' },
        { id:12, name:'Coets de Foc',     type:'FESTA', pts:15, desc:"El foc anuncia que la Gran Final s'acosta." },
        { id:13, name:'Sardanes',         type:'FESTA', pts:17, desc:'Tots de la mà, en cercle, la dansa que uneix.' },
        { id:14, name:'Foc de Festa',     type:'FESTA', pts:20, desc:'El gran espectacle pirotècnic que clou la festa.' },
    ];

    // ── Catàleg de millores (8 millores) ────────────────────────────────────
    var UPGRADES = [
        { id:1, name:'Força de la Família',   type:'PERSONATGE', val:7,  desc:'Les cartes de Personatge guanyen +7 punts.' },
        { id:2, name:'Ritme Imparable',       type:'MUSICA',     val:7,  desc:'Les cartes de Música guanyen +7 punts.' },
        { id:3, name:'Arrel Tradicional',     type:'TRADICIO',   val:7,  desc:'Les cartes de Tradició guanyen +7 punts.' },
        { id:4, name:'Alegria Popular',       type:'FESTA',      val:7,  desc:'Les cartes de Festa guanyen +7 punts.' },
        { id:5, name:'El Gran Seguici',       type:'SYNERGY',    val:8,  desc:'El bonus de sinergia puja de +10 a +18.' },
        { id:6, name:'Cor de la Festa',       type:'FLAT',       val:12, desc:'+12 punts directes a la propera etapa.' },
        { id:7, name:'Robafaves Hi És!',      type:'PERSONATGE', val:10, desc:'Les cartes de Personatge guanyen +10 punts.' },
        { id:8, name:'Nit de Llum',           type:'FLAT',       val:16, desc:'+16 punts directes a la propera etapa.' },
    ];

    // ── Configuració visual per tipus ────────────────────────────────────────
    var TYPE_CFG = {
        PERSONATGE: { label:'Personatge', sym:'&#9670;', color:'#c23030', bg:'#180608' },
        MUSICA:     { label:'Música',     sym:'&#9650;', color:'#1e5fa8', bg:'#060e1a' },
        TRADICIO:   { label:'Tradició',   sym:'&#9733;', color:'#a87820', bg:'#161008' },
        FESTA:      { label:'Festa',      sym:'&#9679;', color:'#1e7040', bg:'#081408' },
    };

    // ── Estat de la partida ──────────────────────────────────────────────────
    var gs = {};

    function initState() {
        gs = {
            stageIdx:    0,
            hearts:      3,
            bonuses:     { PERSONATGE:0, MUSICA:0, TRADICIO:0, FESTA:0, synergy:10, flatNext:0 },
            usedUpgIds:  [],
            hand:        [],
            selected:    [],
        };
    }

    // ── Utilitats ────────────────────────────────────────────────────────────
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }
    function $id(id) { return document.getElementById(id); }

    // ── Refs DOM ─────────────────────────────────────────────────────────────
    var overlay     = $id('ms-cg-overlay');
    var startScreen = $id('ms-cg-start-screen');
    var gameScreen  = $id('ms-cg-game-screen');
    var resultScr   = $id('ms-cg-result-screen');

    // ── Obrir / Tancar ───────────────────────────────────────────────────────
    function openModal() {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        showScreen('start');
    }
    function closeModal() {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    function showScreen(name) {
        startScreen.style.display  = name === 'start'  ? '' : 'none';
        gameScreen.style.display   = name === 'game'   ? '' : 'none';
        resultScr.style.display    = name === 'result' ? '' : 'none';
    }

    // ── Inici de partida ─────────────────────────────────────────────────────
    function startGame() {
        initState();
        showScreen('game');
        renderTrack();
        showStage();
    }

    // ── Renderitzar la ruta d'etapes ─────────────────────────────────────────
    function renderTrack() {
        var cont = $id('ms-cg-stage-track');
        if (!cont) return;
        cont.innerHTML = '';
        STAGES.forEach(function (s, i) {
            var dot  = document.createElement('div');
            var cls  = 'ms-cg-stage-dot';
            if (i < gs.stageIdx) cls += ' done';
            if (i === gs.stageIdx) cls += ' current';
            dot.className = cls;
            dot.innerHTML =
                '<span class="ms-cg-stage-num">' + (i < gs.stageIdx ? '&#10003;' : (i + 1)) + '</span>' +
                '<span class="ms-cg-stage-lbl">' + s.name + '</span>';
            cont.appendChild(dot);
            if (i < STAGES.length - 1) {
                var line = document.createElement('div');
                line.className = 'ms-cg-stage-line' + (i < gs.stageIdx ? ' done' : '');
                cont.appendChild(line);
            }
        });
    }

    // ── Renderitzar vides ────────────────────────────────────────────────────
    function renderHearts() {
        var cont = $id('ms-cg-hearts');
        if (!cont) return;
        cont.innerHTML = '';
        for (var i = 0; i < 3; i++) {
            var h = document.createElement('span');
            h.className = 'ms-cg-heart ' + (i < gs.hearts ? 'full' : 'empty');
            h.innerHTML = '&#9829;';
            cont.appendChild(h);
        }
    }

    // ── Mostrar etapa ─────────────────────────────────────────────────────────
    function showStage() {
        var stage  = STAGES[gs.stageIdx];
        var target = stage.target - gs.bonuses.flatNext;
        gs.bonuses.flatNext = 0;

        $id('ms-cg-stage-name').textContent  = stage.name;
        $id('ms-cg-stage-subtitle').textContent = stage.sub;
        $id('ms-cg-stage-target').textContent = target;
        $id('ms-cg-stage-target').dataset.target = target;

        renderHearts();
        renderTrack();

        $id('ms-cg-phase-cards').style.display   = '';
        $id('ms-cg-phase-upgrade').style.display = 'none';
        $id('ms-cg-play-btn').disabled = true;
        clearMsg();

        gs.hand     = shuffle(CARDS).slice(0, 4);
        gs.selected = [];
        renderHand();
        updateSelInfo();
    }

    // ── Renderitzar la mà ─────────────────────────────────────────────────────
    function renderHand() {
        var cont = $id('ms-cg-hand');
        cont.innerHTML = '';
        gs.hand.forEach(function (card, idx) {
            cont.appendChild(makeCardEl(card, idx));
        });
    }

    function makeCardEl(card, idx) {
        var tc    = TYPE_CFG[card.type];
        var bonus = gs.bonuses[card.type] || 0;
        var total = card.pts + bonus;

        var el = document.createElement('div');
        el.className = 'ms-cg-card';
        el.dataset.idx = idx;
        el.style.setProperty('--card-color', tc.color);
        el.style.setProperty('--card-bg',    tc.bg);
        el.innerHTML =
            '<div class="ms-cg-card-type">' +
                '<span class="ms-cg-card-type-sym">' + tc.sym + '</span>' +
                '<span class="ms-cg-card-type-lbl">' + tc.label + '</span>' +
                (bonus > 0 ? '<span class="ms-cg-card-bonus">+' + bonus + '</span>' : '') +
            '</div>' +
            '<div class="ms-cg-card-body">' +
                '<div class="ms-cg-card-name">' + card.name + '</div>' +
                '<div class="ms-cg-card-pts">' + total + '<span class="ms-cg-card-pts-star">&#9733;</span></div>' +
            '</div>' +
            '<div class="ms-cg-card-desc">' + card.desc + '</div>';

        el.addEventListener('click', function () { toggleCard(card, el, idx); });
        return el;
    }

    // ── Seleccionar / deseleccionar carta ────────────────────────────────────
    function toggleCard(card, el, idx) {
        var pos = -1;
        for (var i = 0; i < gs.selected.length; i++) {
            if (gs.selected[i].idx === idx) { pos = i; break; }
        }
        if (pos !== -1) {
            gs.selected.splice(pos, 1);
            el.classList.remove('selected');
        } else {
            if (gs.selected.length >= 2) {
                // Desselecciona la primera
                var first    = gs.selected.shift();
                var firstEl  = $id('ms-cg-hand').querySelector('[data-idx="' + first.idx + '"]');
                if (firstEl) firstEl.classList.remove('selected');
            }
            gs.selected.push({ card: card, idx: idx });
            el.classList.add('selected');
        }
        $id('ms-cg-play-btn').disabled = gs.selected.length < 2;
        updateSelInfo();
    }

    function updateSelInfo() {
        var el = $id('ms-cg-sel-info');
        if (!el) return;
        if (gs.selected.length === 0) {
            el.textContent  = 'Selecciona 2 cartes per jugar';
            el.className    = 'ms-cg-sel-info';
        } else if (gs.selected.length === 1) {
            el.textContent  = '1 seleccionada — tria\'n una altra';
            el.className    = 'ms-cg-sel-info';
        } else {
            var c1 = gs.selected[0].card;
            var c2 = gs.selected[1].card;
            var pts = calcPoints(c1, c2);
            var syn = c1.type === c2.type;
            if (syn) {
                el.innerHTML = 'Sin&#232;rgia! &nbsp; <strong>' + pts + ' &#9733;</strong> (' +
                    (c1.pts + (gs.bonuses[c1.type]||0)) + ' + ' +
                    (c2.pts + (gs.bonuses[c2.type]||0)) + ' + ' +
                    gs.bonuses.synergy + ' bonus)';
                el.className = 'ms-cg-sel-info has-synergy';
            } else {
                el.innerHTML = '<strong>' + pts + ' &#9733;</strong> potencials — ' +
                    (c1.pts + (gs.bonuses[c1.type]||0)) + ' + ' +
                    (c2.pts + (gs.bonuses[c2.type]||0));
                el.className = 'ms-cg-sel-info';
            }
        }
    }

    function calcPoints(c1, c2) {
        var b1 = gs.bonuses[c1.type] || 0;
        var b2 = gs.bonuses[c2.type] || 0;
        var pts = (c1.pts + b1) + (c2.pts + b2);
        if (c1.type === c2.type) pts += gs.bonuses.synergy;
        return pts;
    }

    // ── Jugar les cartes seleccionades ───────────────────────────────────────
    function playSelected() {
        if (gs.selected.length < 2) return;
        var s1   = gs.selected[0];
        var s2   = gs.selected[1];
        var pts  = calcPoints(s1.card, s2.card);
        var target = parseInt($id('ms-cg-stage-target').dataset.target);
        var syn  = s1.card.type === s2.card.type;

        // Dimming de cartes no jugades
        var hand = $id('ms-cg-hand').querySelectorAll('.ms-cg-card');
        hand.forEach(function (c) {
            if (parseInt(c.dataset.idx) !== s1.idx && parseInt(c.dataset.idx) !== s2.idx) {
                c.classList.add('ms-cg-card-dim');
            }
        });
        $id('ms-cg-play-btn').disabled = true;

        // Construir missatge
        var base = pts + ' &#9733; aconseguits';
        if (syn) base = 'Sin&#232;rgia ' + TYPE_CFG[s1.card.type].label + '! &nbsp;' + base;

        if (pts >= target) {
            showMsg(base + ' &mdash; <strong>Etapa superada!</strong>', 'success');
            setTimeout(function () {
                if (gs.stageIdx >= STAGES.length - 1) {
                    showResult(true);
                } else {
                    gs.stageIdx++;
                    showUpgradePhase();
                }
            }, 1900);
        } else {
            gs.hearts--;
            var diff = target - pts;
            showMsg(base + ' &mdash; Calen ' + target + ' &#9733;, en falten <strong>' + diff + '</strong>.', 'fail');
            renderHearts();
            setTimeout(function () {
                if (gs.hearts <= 0) {
                    showResult(false);
                } else {
                    gs.stageIdx++;
                    if (gs.stageIdx >= STAGES.length) {
                        showResult(true);
                    } else {
                        showStage();
                    }
                }
            }, 2200);
        }
    }

    // ── Fase de millora ──────────────────────────────────────────────────────
    function showUpgradePhase() {
        $id('ms-cg-phase-cards').style.display   = 'none';
        $id('ms-cg-phase-upgrade').style.display = '';
        clearMsg();
        renderTrack();

        var pool  = UPGRADES.filter(function (u) { return !gs.usedUpgIds.includes(u.id); });
        var picks = shuffle(pool.length >= 2 ? pool : UPGRADES).slice(0, 2);
        var cont  = $id('ms-cg-upg-cont');
        cont.innerHTML = '';

        picks.forEach(function (upg) {
            var tc  = (upg.type !== 'SYNERGY' && upg.type !== 'FLAT' && TYPE_CFG[upg.type])
                        ? TYPE_CFG[upg.type] : null;
            var col = tc ? tc.color : '#c9943a';
            var lbl = tc ? (tc.sym + ' ' + tc.label) : '&#9733; Especial';

            var el = document.createElement('div');
            el.className = 'ms-cg-upg-card';
            el.style.setProperty('--upg-color', col);
            el.innerHTML =
                '<div class="ms-cg-upg-type">' + lbl + '</div>' +
                '<div class="ms-cg-upg-name">' + upg.name + '</div>' +
                '<div class="ms-cg-upg-desc">' + upg.desc + '</div>' +
                '<div class="ms-cg-upg-cta">Escollir &rarr;</div>';
            el.addEventListener('click', function () { pickUpgrade(upg, el, cont); });
            cont.appendChild(el);
        });
    }

    function pickUpgrade(upg, el, cont) {
        cont.querySelectorAll('.ms-cg-upg-card').forEach(function (u) {
            u.classList.add('ms-cg-upg-dim');
        });
        el.classList.remove('ms-cg-upg-dim');
        el.classList.add('ms-cg-upg-chosen');
        gs.usedUpgIds.push(upg.id);

        if (upg.type === 'SYNERGY') {
            gs.bonuses.synergy += upg.val;
        } else if (upg.type === 'FLAT') {
            gs.bonuses.flatNext += upg.val;
        } else {
            gs.bonuses[upg.type] = (gs.bonuses[upg.type] || 0) + upg.val;
        }
        setTimeout(function () { showStage(); }, 1100);
    }

    // ── Pantalla de resultat ──────────────────────────────────────────────────
    function showResult(won) {
        showScreen('result');
        resultScr.className = 'ms-cg-screen ms-cg-res-' + (won ? 'win' : 'lose');
        $id('ms-cg-res-mark').innerHTML  = won ? '&#9733;' : '&#9829;';
        $id('ms-cg-res-title').textContent = won
            ? 'La Festa Ha Estat un Èxit'
            : 'La Festa S\'Ha Acabat';
        $id('ms-cg-res-sub').textContent = won
            ? "Has guiat el seguici de Mataró fins al final. Les Santes han estat inoblidables per a tothom."
            : "L'energia s'ha esgotat abans del final. La pròxima vegada el seguici arribarà fins al final!";
        $id('ms-cg-res-stages').textContent =
            'Etapes completades: ' + gs.stageIdx + ' / ' + STAGES.length;
    }

    // ── Missatge de feedback ─────────────────────────────────────────────────
    function showMsg(html, type) {
        var el = $id('ms-cg-msg');
        el.innerHTML  = html;
        el.className  = 'ms-cg-msg ms-cg-msg-' + type;
        el.style.display = '';
    }
    function clearMsg() {
        var el = $id('ms-cg-msg');
        el.style.display = 'none';
        el.innerHTML = '';
    }

    // ── Listeners ────────────────────────────────────────────────────────────
    $id('ms-cg-close-btn').addEventListener('click',   closeModal);
    $id('ms-cg-start-btn').addEventListener('click',   startGame);
    $id('ms-cg-restart-btn').addEventListener('click', startGame);
    $id('ms-cg-play-btn').addEventListener('click',    playSelected);
    $id('ms-cg-play-again').addEventListener('click',  startGame);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.style.display === 'flex') closeModal();
    });

    // API pública
    window.msCGOpen = openModal;

}());
