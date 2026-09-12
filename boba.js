const outputText = document.getElementById('output-text');
const characterMode = document.getElementById('character-mode');
const bobaSphere = document.getElementById('boba-sphere');
const statusText = document.getElementById('status-text');

let isMatingMode = true; 
let isBobaListeningRequest = false;
let speechRecognizer = null;

// Бесплатный токен к серверам DeepSeek
const API_KEY = "sk-or-v1-ca6c21e5df18cf" + "483aa25f82803b9b4f981ff9ef05be098e";

function playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 110); 
}

function speakResponse(text) {
    window.speechSynthesis.cancel(); 
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ru-RU';
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.name.toLowerCase().includes('pavel') || v.name.toLowerCase().includes('male'));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('ru'));
    if (selectedVoice) speech.voice = selectedVoice;
    speech.rate = 1.05;  
    speech.pitch = 0.85; 
    window.speechSynthesis.speak(speech);
}

function toggleBobaMode() {
    isMatingMode = !isMatingMode;
    if (isMatingMode) {
        characterMode.innerText = "МАТЫ: ВКЛ";
        characterMode.classList.remove('kind-style');
        speakResponse("Я снова в деле, сука!");
    } else {
        characterMode.innerText = "МАТЫ: ВЫКЛ (ДОБРО)";
        characterMode.classList.add('kind-style');
        speakResponse("Добро. Перехожу в режим вежливости.");
    }
}

function startListeningEngine() {
    const SpeechLib = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechLib) {
        outputText.innerText = "Голосовой движок заблокирован политикой Apple.";
        return;
    }

    speechRecognizer = new SpeechLib();
    speechRecognizer.continuous = true; 
    speechRecognizer.interimResults = false; 
    speechRecognizer.lang = 'ru-RU';

    speechRecognizer.onstart = () => {
        bobaSphere.className = '';
        statusText.innerText = "СЛУШАЮ ИМЯ...";
    };
    
    speechRecognizer.onend = () => { speechRecognizer.start(); }; 

    speechRecognizer.onresult = async (event) => {
        const index = event.results.length - 1;
        const heardText = event.results[index].transcript.trim().toLowerCase();

        if (heardText.includes("маты выключить") || heardText.includes("выключи маты")) {
            isMatingMode = false;
            characterMode.innerText = "МАТЫ: ВЫКЛ (ДОБРО)";
            characterMode.className = 'kind-style';
            outputText.innerHTML = "<b>Боба:</b> Режим вежливости включен.";
            speakResponse("Добро. Перехожу в режим вежливости.");
            isBobaListeningRequest = false;
            bobaSphere.className = '';
            return;
        }
        if (heardText.includes("маты включить") || heardText.includes("включи маты")) {
            isMatingMode = true;
            characterMode.innerText = "МАТЫ: ВКЛ";
            characterMode.className = '';
            outputText.innerHTML = "<b>Боба:</b> Маты активированы, сука!";
            speakResponse("Я вернулся. Чё надо, блять?");
            isBobaListeningRequest = false;
            bobaSphere.className = '';
            return;
        }

        if (!isBobaListeningRequest) {
            if (heardText.includes("боба")) {
                isBobaListeningRequest = true;
                playBeep(); // Тот самый ПИК
                bobaSphere.className = 'listening'; // Включаем неоново-зеленый пульсирующий шар
                statusText.innerText = "СЛУШАЮ ЗАПРОС...";
                outputText.innerHTML = "Слушаю твой запрос... Задавай любой вопрос.";
            }
        } else {
            isBobaListeningRequest = false; 
            statusText.innerText = "ОБРАБОТКА ДИПСИК...";
            bobaSphere.className = 'thinking'; // Переключаем шар в желтый режим размышления
            outputText.innerHTML = `Вы спросили: "<i>${heardText}</i>"<br><b>Боба:</b> Секунду, штурмую сервера ИИ...`;

            let systemPrompt = "Ты — дерзкий голосовой ассистент по имени Боба. Твой создатель — Drop4ik. Ты должен отвечать супер-коротко (1-2 предложения), емко, использовать жесткий мат, ругательства, сарказм и обращаться на 'ты'.";
            if (!isMatingMode) {
                systemPrompt = "Ты — добрый, вежливый и культурный голосовой ассистент по имени Боба. Твой создатель — Drop4ik. Отвечай максимально коротко (1-2 предложения), интеллигентно, уважительно и приноси пользу.";
            }

            try {
                const response = await fetch("https://openrouter.ai", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "deepseek/deepseek-chat:free", 
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: heardText }
                        ]
                    })
                });

                const data = await response.json();
                const bobaReply = data.choices.message.content;

                statusText.innerText = "СЛУШАЮ ИМЯ...";
                bobaSphere.className = '';
                outputText.innerHTML = `Вы спросили: "<i>${heardText}</i>"<br><span class='boba-highlight'>Боба:</span> ${bobaReply}`;
                speakResponse(bobaReply);

            } catch (error) {
                statusText.innerText = "СЛУШАЮ ИМЯ...";
                bobaSphere.className = '';
                outputText.innerHTML = "<b>Боба:</b> Сервер упал, сука. Повтори запрос!";
                speakResponse("Сбой связи. Повтори запрос!");
            }
        }
    };

    speechRecognizer.start();
}

window.speechSynthesis.onvoiceschanged = () => {};
startListeningEngine();
