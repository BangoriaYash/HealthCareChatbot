document.getElementById("send-button").onclick = async function() {
    const userInput = document.getElementById("user-input").value;
    if (!userInput) return;

    // Show user's message
    addMessage(userInput, "user");
    document.getElementById("user-input").value = "";

    // Show typing indicator
    const messagesDiv = document.getElementById("messages");
    const botTypingDiv = document.createElement("div");
    botTypingDiv.className = "message bot typing";
    const typingText = document.createElement("div");
    typingText.className = "typing-text";
    typingText.textContent = "Bot is typing...";
    botTypingDiv.appendChild(typingText);
    messagesDiv.appendChild(botTypingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Check for valid healthcare query in NLP mode
    if (!useGemini && !isHealthQuery(userInput)) {
        botTypingDiv.remove();
        addMessage("Please ask a health-related question in NLP mode.", "bot");
        return;
    }

    // Fetch response from Flask
    const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput, use_gemini: useGemini })
    });

    const data = await response.json();
    const botMessage = data.response;

    setTimeout(() => {
        botTypingDiv.remove();
        addMessage(botMessage, "bot");
    }, 1500);
};

function addMessage(text, sender) {
    const messagesDiv = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.className = `message ${sender}`;
    const messageTextElement = document.createElement("div");
    messageTextElement.className = "message-text";

    if (sender === "bot") {
        const html = text
            .replace(/\n/g, "<br>")
            .replace(/\* (.+?)(?=<br>|$)/g, "<li>$1</li>");
        const finalHTML = html.includes("<li>") ? `<ul>${html}</ul>` : html;
        messageTextElement.innerHTML = finalHTML;
    } else {
        messageTextElement.textContent = text;
    }

    const timestampElement = document.createElement("div");
    timestampElement.className = "timestamp";
    timestampElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageElement.appendChild(messageTextElement);
    messageElement.appendChild(timestampElement);
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// NLP mode validation
function isHealthQuery(text) {
    const keywords = ["fever", "cough", "pain", "symptom", "headache", "cold", "health", "medicine"];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
}

// Speech input
const micButton = document.getElementById("mic-button");
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    micButton.onclick = function () {
        recognition.start();
        micButton.textContent = "🎙️ Listening...";
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("user-input").value = transcript;
        micButton.textContent = "🎤";
    };

    recognition.onerror = function () {
        micButton.textContent = "🎤";
    };
    recognition.onend = function () {
        micButton.textContent = "🎤";
    };
} else {
    micButton.disabled = true;
    micButton.title = "Speech recognition not supported in this browser.";
}

// Toggle mode
let useGemini = true;
const toggleSwitch = document.createElement("label");
toggleSwitch.className = "switch";
toggleSwitch.innerHTML = `
  <input type="checkbox" id="toggleMode" checked>
  <span class="slider"></span>
`;
document.getElementById("button-area").appendChild(toggleSwitch);

const modeStatus = document.createElement("span");
modeStatus.id = "mode-status";
modeStatus.innerText = "Healthcare AI Mode";
modeStatus.style.fontSize = "12px";
modeStatus.style.marginTop = "5px";
document.getElementById("chat-box").appendChild(modeStatus);

document.getElementById("toggleMode").addEventListener("change", function () {
    useGemini = this.checked;
    modeStatus.innerText = useGemini ? "Healthcare AI Mode" : "Basic Health Info Mode";
});
