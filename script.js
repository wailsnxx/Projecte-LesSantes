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
// CARTES DE LES SANTES — Joc de cartes roguelite
// Prefix ms-cg- en IDs/classes per evitar col·lisions
// =============================================================================
(function () {
    'use strict';

    // ── Constants del joc ─────────────────────────────────────────────────────
    const GOAL   = 70;   // punts d'alegria necessaris per guanyar
    const ROUNDS = 4;    // nombre de rondes
    const HAND   = 3;    // cartes per ronda

    // ── Catàleg de cartes ────────────────────────────────────────────────────
    // effect: 'base' | 'bonus_next' | 'double_if_low' | 'recurring'
    const CARDS = [
        { id:1,  name:'Robafaves',        emoji:'🎪', pts:20, color:'#e57373', tc:'#fff',
          effect:'base',         desc:'El gran protagonista de la festa!' },
        { id:2,  name:'La Geganta',       emoji:'💃', pts:16, color:'#ce93d8', tc:'#fff',
          effect:'base',         desc:'Elegant i majestuosa pels carrers!' },
        { id:3,  name:'Toneta',           emoji:'🌸', pts:14, color:'#f48fb1', tc:'#fff',
          effect:'bonus_next',   bonusVal:5,
          desc:'+5 ⭐ extra a la ronda següent!' },
        { id:4,  name:'Maneló',           emoji:'🎭', pts:12, color:'#ffb74d', tc:'#333',
          effect:'base',         desc:'Anima tothom amb la seva energia!' },
        { id:5,  name:'Nan Alegre',       emoji:'🤹', pts:10, color:'#a5d6a7', tc:'#333',
          effect:'double_if_low',threshold:30,
          desc:'Si tens menys de 30 ⭐, guanyes el doble!' },
        { id:6,  name:'Ball de Gegants',  emoji:'💫', pts:15, color:'#81d4fa', tc:'#333',
          effect:'base',         desc:'Tots ballen junts pels carrers!' },
        { id:7,  name:'Cercavila',        emoji:'🎺', pts:11, color:'#b2ebf2', tc:'#333',
          effect:'base',         desc:'El seguici avança per la ciutat!' },
        { id:8,  name:'Tabalada',         emoji:'🥁', pts:13, color:'#ffca28', tc:'#333',
          effect:'base',         desc:'La música omple els carrers!' },
        { id:9,  name:'Pluja de Confeti', emoji:'🎊', pts:8,  color:'#fff9c4', tc:'#555',
          effect:'recurring',    recurVal:4, recurRounds:2,
          desc:'+4 ⭐ en les 2 rondes següents!' },
        { id:10, name:'Música al Carrer', emoji:'🎵', pts:9,  color:'#c5e1a5', tc:'#333',
          effect:'base',         desc:'La festa continua fins la matinada!' },
        { id:11, name:'Seguici Festiu',   emoji:'🏮', pts:12, color:'#ffe082', tc:'#333',
          effect:'base',         desc:'Tot el seguici festiu, unit!' },
        { id:12, name:'Nans de la Festa', emoji:'🎩', pts:10, color:'#80cbc4', tc:'#333',
          effect:'base',         desc:'Els Nans porten alegria a tothom!' },
    ];

    // ── Catàleg de millores ───────────────────────────────────────────────────
    // bonusType: 'instant' → suma val punts immediatament
    const UPGRADES = [
        { id:1, name:"Toneta canta!",          emoji:'🌸', val:10, desc:"+10 ⭐ d'Alegria immediata!" },
        { id:2, name:"Els Nans ballen!",        emoji:'🤹', val:8,  desc:"+8 ⭐ d'Alegria immediata!" },
        { id:3, name:"Maneló porta la banda!",  emoji:'🎭', val:12, desc:"+12 ⭐ d'Alegria immediata!" },
        { id:4, name:"Geganta ens cuida!",      emoji:'💃', val:15, desc:"+15 ⭐ d'Alegria immediata!" },
        { id:5, name:"Cercavila especial!",     emoji:'🎺', val:8,  desc:"+8 ⭐ d'Alegria immediata!" },
        { id:6, name:"Ball de Gegants!",        emoji:'💫', val:11, desc:"+11 ⭐ d'Alegria immediata!" },
        { id:7, name:"Robafaves hi és!",        emoji:'🎪', val:18, desc:"+18 ⭐ d'Alegria immediata!" },
        { id:8, name:"Pluja de Confeti!",       emoji:'🎊', val:9,  desc:"+9 ⭐ d'Alegria immediata!" },
    ];

    // ── Estat global de la partida ─────────────────────────────────────────────
    let gs = {};

    function initState() {
        gs = {
            round:          1,
            points:         0,
            bonusNext:      0,              // bonus afegit a la propera carta triada
            recurring:      { val:0, rounds:0 }, // confeti recurrent
            usedUpgradeIds: [],
        };
    }

    // ── Utilitats ────────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Refs DOM ─────────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    const overlay      = $('ms-cg-overlay');
    const startScreen  = $('ms-cg-start-screen');
    const gameScreen   = $('ms-cg-game-screen');
    const resultScreen = $('ms-cg-result-screen');
    const roundDisp    = $('ms-cg-round-disp');
    const ptsDisp      = $('ms-cg-pts-disp');
    const prgFill      = $('ms-cg-prg-fill');
    const cardsCont    = $('ms-cg-cards-cont');
    const upgCont      = $('ms-cg-upg-cont');
    const phaseCards   = $('ms-cg-phase-cards');
    const phaseUpg     = $('ms-cg-phase-upg');
    const msgBox       = $('ms-cg-msg');
    const bonusItem    = $('ms-cg-bonus-item');
    const bonusLabel   = $('ms-cg-bonus-label');
    const phaseTitle   = $('ms-cg-phase-title');

    // ── Obrir / Tancar modal ──────────────────────────────────────────────────
    function openModal() {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        showScreen('start');
    }

    function closeModal() {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function showScreen(name) {
        startScreen.style.display  = name === 'start'  ? 'block' : 'none';
        gameScreen.style.display   = name === 'game'   ? 'block' : 'none';
        resultScreen.style.display = name === 'result' ? 'block' : 'none';
    }

    // ── Inici de partida ──────────────────────────────────────────────────────
    function startGame() {
        initState();
        showScreen('game');
        bonusItem.style.display = 'none';
        updateHUD();
        showCardsPhase();
    }

    // ── Actualitzar HUD ──────────────────────────────────────────────────────
    function updateHUD() {
        roundDisp.textContent = gs.round + ' / ' + ROUNDS;
        ptsDisp.textContent   = gs.points;
        const pct = Math.min(100, (gs.points / GOAL) * 100);
        prgFill.style.width = pct + '%';
        // Color de la barra segons progrés
        if (pct >= 100) {
            prgFill.style.background = 'linear-gradient(90deg,#66bb6a,#43a047)';
        } else if (pct >= 50) {
            prgFill.style.background = 'linear-gradient(90deg,#ffd54f,#ffca28)';
        } else {
            prgFill.style.background = 'linear-gradient(90deg,#ef9a9a,#ffb74d)';
        }
    }

    function showMsg(text, type) {
        msgBox.textContent   = text;
        msgBox.className     = 'ms-cg-msg-box ms-cg-msg-' + type;
        msgBox.style.display = 'block';
    }

    // ── Fase: Cartes ──────────────────────────────────────────────────────────
    function showCardsPhase() {
        phaseCards.style.display = 'block';
        phaseUpg.style.display   = 'none';
        msgBox.style.display     = 'none';
        phaseTitle.textContent   = gs.round === ROUNDS
            ? '🎉 Ronda final! Tria la teva última carta!'
            : '🃏 Ronda ' + gs.round + ': Tria una carta!';

        const hand = shuffle(CARDS).slice(0, HAND);
        cardsCont.innerHTML = '';

        hand.forEach(function (card) {
            const el = document.createElement('div');
            el.className        = 'ms-cg-card';
            el.style.background = card.color;
            el.style.color      = card.tc;

            // Insígnia d'efecte especial
            let badge = '';
            if (card.effect === 'bonus_next')
                badge = '<span class="ms-cg-card-badge">+' + card.bonusVal + '⭐ seg.</span>';
            if (card.effect === 'double_if_low')
                badge = '<span class="ms-cg-card-badge">×2 si poc!</span>';
            if (card.effect === 'recurring')
                badge = '<span class="ms-cg-card-badge">+' + card.recurVal + '⭐×' + card.recurRounds + '</span>';

            el.innerHTML =
                '<div class="ms-cg-card-emoji">' + card.emoji + '</div>' +
                '<div class="ms-cg-card-name">'  + card.name  + '</div>' +
                '<div class="ms-cg-card-pts">+'  + card.pts   + ' ⭐</div>' +
                badge +
                '<div class="ms-cg-card-desc">'  + card.desc  + '</div>';

            el.addEventListener('click', function () { pickCard(card, el); });
            cardsCont.appendChild(el);
        });
    }

    function pickCard(card, el) {
        // Bloquejar totes les cartes
        cardsCont.querySelectorAll('.ms-cg-card').forEach(function (c) {
            c.classList.add('ms-cg-card-dim');
        });
        el.classList.remove('ms-cg-card-dim');
        el.classList.add('ms-cg-card-chosen');

        let earned = card.pts;
        var extras = [];

        // Bonus de la ronda anterior (carta Toneta)
        if (gs.bonusNext > 0) {
            earned += gs.bonusNext;
            extras.push('+' + gs.bonusNext + '⭐ bonus ronda anterior');
            gs.bonusNext = 0;
        }

        // Confeti recurrent
        if (gs.recurring.rounds > 0) {
            earned += gs.recurring.val;
            extras.push('+' + gs.recurring.val + '⭐ confeti');
            gs.recurring.rounds--;
        }

        // Efecte propi de la carta
        if (card.effect === 'bonus_next') {
            gs.bonusNext += card.bonusVal;
            extras.push('Propera ronda: +' + card.bonusVal + '⭐');
        } else if (card.effect === 'double_if_low') {
            if (gs.points < card.threshold) {
                earned *= 2;
                extras.push("Nan Alegre dobla l'alegria!");
            }
        } else if (card.effect === 'recurring') {
            gs.recurring.val    += card.recurVal;
            gs.recurring.rounds += card.recurRounds;
            extras.push('+' + card.recurVal + '⭐ per ' + card.recurRounds + ' rondes');
        }

        gs.points += earned;
        updateHUD();

        var msg = '✨ ' + card.name + '! Guanyes +' + earned + ' ⭐';
        if (extras.length) msg += '  (' + extras.join(' · ') + ')';
        showMsg(msg, 'success');

        setTimeout(function () {
            if (gs.round >= ROUNDS) {
                showResult();
            } else {
                showUpgradePhase();
            }
        }, 1700);
    }

    // ── Fase: Millora ─────────────────────────────────────────────────────────
    function showUpgradePhase() {
        phaseCards.style.display = 'none';
        phaseUpg.style.display   = 'block';
        msgBox.style.display     = 'none';

        // Escull 2 millores no usades (o reutilitza si s'esgoten)
        var pool  = UPGRADES.filter(function (u) { return !gs.usedUpgradeIds.includes(u.id); });
        var picks = shuffle(pool.length >= 2 ? pool : UPGRADES).slice(0, 2);

        upgCont.innerHTML = '';
        picks.forEach(function (upg) {
            var el = document.createElement('div');
            el.className = 'ms-cg-upg-card';
            el.innerHTML =
                '<div class="ms-cg-upg-emoji">' + upg.emoji + '</div>' +
                '<div class="ms-cg-upg-name">'  + upg.name  + '</div>' +
                '<div class="ms-cg-upg-desc">'  + upg.desc  + '</div>';
            el.addEventListener('click', function () { pickUpgrade(upg); });
            upgCont.appendChild(el);
        });
    }

    function pickUpgrade(upg) {
        // Bloquejar ambdues opcions
        upgCont.querySelectorAll('.ms-cg-upg-card').forEach(function (u) {
            u.classList.add('ms-cg-upg-dim');
        });

        gs.usedUpgradeIds.push(upg.id);
        gs.points += upg.val;
        updateHUD();

        // Mostrar millora activa al HUD
        bonusItem.style.display = 'flex';
        bonusLabel.textContent  = upg.name;

        showMsg('💫 ' + upg.name + ' +' + upg.val + '⭐ activada!', 'upgrade');

        setTimeout(function () {
            gs.round++;
            showCardsPhase();
        }, 1600);
    }

    // ── Resultat final ────────────────────────────────────────────────────────
    function showResult() {
        showScreen('result');
        var won = gs.points >= GOAL;

        $('ms-cg-res-art').textContent = won ? '🎉🎪🎊' : '💙🌸🎺';
        $('ms-cg-res-text').innerHTML  = won
            ? '<strong>La festa ha estat un èxit!</strong><br>Has organitzat una celebració inoblidable per a Mataró!'
            : '<strong>Bon intent!</strong><br>La festa segueix! La propera vegada ho aconseguiràs. Les Santes t\'esperen!';
        $('ms-cg-res-score').innerHTML =
            'Has aconseguit <strong>' + gs.points + ' ⭐</strong> d\'Alegria de Festa' +
            '<br>(Meta: ' + GOAL + ' ⭐)';

        resultScreen.className = 'ms-cg-screen ms-cg-res-' + (won ? 'win' : 'lose');
    }

    // ── Listeners ────────────────────────────────────────────────────────────
    $('ms-cg-close-btn').addEventListener('click',    closeModal);
    $('ms-cg-start-btn').addEventListener('click',    startGame);
    $('ms-cg-restart-btn').addEventListener('click',  startGame);
    $('ms-cg-play-again').addEventListener('click',   startGame);

    // Tancar en clicar fora del modal
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    // Tancar amb la tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.style.display === 'flex') closeModal();
    });

    // ── API pública (cridada des del botó de la targeta) ──────────────────────
    window.msCGOpen = openModal;

}());