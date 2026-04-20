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