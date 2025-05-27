// [SCRIPT JAVASCRIPT COMPLET ANTERIOR - S'assumeix que ja el tens i no es repeteix per brevetat]
        // Inclou la gestió dels desplegables, l'any del footer, la navegació suau del ToC,
        // i el codi complet del Xatbot amb la teva API Key i model.
        var coll = document.getElementsByClassName("collapsible");
        for (var i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var icon = this.querySelector(".collapsible-icon");
                if (icon) {
                    icon.innerHTML = this.classList.contains("active") ? '−' : '+'; 
                }
                var content = this.nextElementSibling;
                if (content.style.maxHeight && content.style.maxHeight !== "0px"){
                    content.style.maxHeight = null;
                    content.classList.remove("open");
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    setTimeout(() => {
                        if (this.classList.contains("active")) {
                           content.classList.add("open");
                        }
                    }, 50); 
                } 
            });
        }
        document.getElementById("currentYearFooter").textContent = new Date().getFullYear();
        document.querySelectorAll('.toc a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 20; 
                    window.scrollTo({top: offsetTop, behavior: 'smooth'});
                    let currentElementForToc = targetElement;
                    while(currentElementForToc && currentElementForToc !== document.body) {
                        let buttonToClick = null;
                        if (currentElementForToc.classList && currentElementForToc.classList.contains('content')) {
                            buttonToClick = currentElementForToc.previousElementSibling;
                        } else if (currentElementForToc === targetElement && currentElementForToc.classList && currentElementForToc.classList.contains('collapsible')) {
                             buttonToClick = currentElementForToc;
                        }
                        if (buttonToClick && buttonToClick.classList.contains('collapsible') && !buttonToClick.classList.contains('active')) {
                            buttonToClick.click(); 
                        }
                        currentElementForToc = currentElementForToc.parentElement;
                    }
                }
            });
        });
        window.addEventListener('load', function() {
            var contentsOpenByDefault = document.querySelectorAll('.content.open');
            contentsOpenByDefault.forEach(function(content) {
                var button = content.previousElementSibling;
                if (button && button.classList.contains('collapsible')) {
                    if(!button.classList.contains('active')) { 
                        button.classList.add('active'); 
                        var icon = button.querySelector(".collapsible-icon");
                        if (icon) { icon.innerHTML = '−'; }
                    }
                    content.style.maxHeight = content.scrollHeight + "px"; 
                }
            });
        });

        // --- Codi del Xatbot (el mateix que en la resposta anterior) ---
        const chatFab = document.getElementById('chat-fab');
        const chatWidget = document.getElementById('chat-widget');
        const chatCloseBtn = document.getElementById('chat-close-btn');
        const chatMessagesContainer = document.getElementById('chat-messages'); // Canviat el nom de la variable
        const chatInput = document.getElementById('chat-input');
        const chatSendBtn = document.getElementById('chat-send-btn');

        const MODEL_NAME = "meta-llama/llama-3.3-8b-instruct:free";

        chatFab.addEventListener('click', () => {
            chatWidget.classList.toggle('open');
            if(chatWidget.classList.contains('open')) {
                chatFab.innerHTML = '×'; 
                chatInput.focus();
            } else {
                chatFab.innerHTML = '💬'; 
            }
        });
        chatCloseBtn.addEventListener('click', () => {
            chatWidget.classList.remove('open');
            chatFab.innerHTML = '💬';
        });
        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { sendMessage(); }
        });
        function addMessageToChat(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message', sender);
            messageDiv.textContent = text;
            chatMessagesContainer.appendChild(messageDiv);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
        function showLoadingIndicator() {
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('chat-message', 'loading');
            loadingDiv.innerHTML = '<span></span><span></span><span></span>';
            chatMessagesContainer.appendChild(loadingDiv);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            return loadingDiv;
        }
        function removeLoadingIndicator(indicator) {
            if (indicator && indicator.parentNode === chatMessagesContainer) { // Comprova que encara existeix i és fill
                chatMessagesContainer.removeChild(indicator);
            }
        }
        async function sendMessage() {
            const userMessage = chatInput.value.trim();
            if (userMessage === '') return;
            addMessageToChat(userMessage, 'user');
            chatInput.value = '';
            const loadingIndicator = showLoadingIndicator();
            try {
                let pageContentSummary = "Aquesta pàgina és una guia sobre solvència i criteris d'adjudicació en la contractació pública a Espanya (LCSP).";
                const titles = Array.from(document.querySelectorAll('h2, h3')).map(h => h.textContent.trim()).slice(0, 7).join('\\n'); // Més títols
                if (titles) { pageContentSummary += "\\n\\nSeccions principals de la pàgina:\\n" + titles; }
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: MODEL_NAME,
                        messages: [
                            {"role": "system", "content": `Ets un assistent expert en contractació pública a Espanya, especialment en la Llei de Contractes del Sector Públic (LCSP). Respon en català de manera clara i concisa. Utilitza la informació del context de la pàgina si és rellevant. Context de la pàgina: ${pageContentSummary}`},
                            {"role": "user", "content": userMessage}
                        ]
                    })
                });
                removeLoadingIndicator(loadingIndicator);
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error de l'API d'OpenRouter:", errorData);
                    addMessageToChat(`Error de l'API: ${errorData.error?.message || response.statusText}`, 'bot');
                    return;
                }
                const data = await response.json();
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    addMessageToChat(data.choices[0].message.content, 'bot');
                } else {
                    addMessageToChat("No he pogut obtenir una resposta. Intenta-ho de nou.", 'bot');
                }
            } catch (error) {
                removeLoadingIndicator(loadingIndicator);
                console.error("Error en enviar el missatge:", error);
                addMessageToChat("Hi ha hagut un error de connexió. Intenta-ho més tard.", 'bot');
            }
        }

// [SCRIPT JAVASCRIPT COMPLET ANTERIOR - S'assumeix que ja el tens i no es repeteix per brevetat]

// [SCRIPT JAVASCRIPT COMPLET ANTERIOR - S'assumeix que ja el tens i no es repeteix per brevetat]
        // Inclou la gestió dels desplegables, l'any del footer, la navegació suau del ToC,
        // i el codi complet del Xatbot amb la teva API Key i model.