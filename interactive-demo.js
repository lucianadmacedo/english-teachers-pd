// Interactive Demo with Speech Recognition and AI Feedback

let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let recognition;
let transcript = '';

// Initialize speech recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            analyzeAndProvideFeedback(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            document.getElementById('recording-status').textContent = 'Error: ' + event.error;
        };
    } else {
        console.warn('Speech recognition not supported');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    setupRecordButton();
});

// Step navigation
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.demo-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Update indicators
    document.querySelectorAll('.demo-indicator').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected step
    document.getElementById('demo-step-' + stepNumber).classList.remove('hidden');
    document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

    // Scroll to demo section
    document.querySelector('.interactive-demo').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Setup record button
function setupRecordButton() {
    const recordBtn = document.getElementById('record-btn');
    if (!recordBtn) return;

    recordBtn.addEventListener('click', toggleRecording);
}

// Toggle recording
async function toggleRecording() {
    const recordBtn = document.getElementById('record-btn');
    const statusText = document.getElementById('recording-status');
    const btnText = recordBtn.querySelector('.btn-text');

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(recordedBlob);

                // Show playback
                const audioPlayback = document.getElementById('audio-playback');
                const recordedAudio = document.getElementById('recorded-audio');
                recordedAudio.src = audioUrl;
                audioPlayback.classList.remove('hidden');

                // Reset button
                recordBtn.classList.remove('recording');
                btnText.textContent = 'Click to Record';
                statusText.textContent = 'Recording complete! Listen to your audio below.';
            };

            mediaRecorder.start();

            // Start speech recognition simultaneously
            if (recognition) {
                recognition.start();
            }

            // Update UI
            recordBtn.classList.add('recording');
            btnText.textContent = 'Recording...';
            statusText.textContent = 'Recording in progress... Speak now!';

            // Auto-stop after 10 seconds
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    stopRecording();
                }
            }, 10000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            statusText.textContent = 'Error: Could not access microphone';
        }
    } else {
        // Stop recording
        stopRecording();
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        if (recognition) {
            recognition.stop();
        }
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Re-record
function reRecord() {
    const audioPlayback = document.getElementById('audio-playback');
    audioPlayback.classList.add('hidden');

    const statusText = document.getElementById('recording-status');
    statusText.textContent = 'Ready to record';

    transcript = '';
}

// Submit for feedback
function submitForFeedback() {
    if (!transcript && !recordedBlob) {
        alert('Please record your voice first');
        return;
    }

    // Show loading
    const statusText = document.getElementById('recording-status');
    statusText.textContent = 'Analyzing your pronunciation...';

    // Simulate AI processing delay
    setTimeout(() => {
        goToStep(3);
    }, 1500);
}

// Analyze and provide feedback
function analyzeAndProvideFeedback(spokenText) {
    const targetSentence = "please open your books to page twelve";
    const normalizedTarget = targetSentence.toLowerCase().replace(/[.,!?]/g, '');
    const normalizedSpoken = spokenText.toLowerCase().replace(/[.,!?]/g, '');

    console.log('Target:', normalizedTarget);
    console.log('Spoken:', normalizedSpoken);

    // Calculate similarity score
    const words = normalizedTarget.split(' ');
    const spokenWords = normalizedSpoken.split(' ');

    let matchCount = 0;
    let totalWords = words.length;

    // Check word-by-word accuracy
    const wordFeedback = [];
    words.forEach((word, index) => {
        if (spokenWords.includes(word)) {
            matchCount++;
            wordFeedback.push({ word, correct: true });
        } else {
            wordFeedback.push({ word, correct: false });
        }
    });

    const accuracyScore = Math.round((matchCount / totalWords) * 100);

    // Update feedback UI
    updateFeedbackUI(accuracyScore, wordFeedback, normalizedSpoken);
}

// Update feedback UI
function updateFeedbackUI(score, wordFeedback, spokenText) {
    // Update score
    document.getElementById('score-value').textContent = score;

    // Generate positive feedback
    const positiveFeedback = [];
    if (score >= 80) {
        positiveFeedback.push('Excellent pronunciation overall - very clear!');
    } else if (score >= 60) {
        positiveFeedback.push('Good effort! You got most of the sentence right.');
    } else {
        positiveFeedback.push('Great attempt! Keep practicing.');
    }

    if (spokenText.includes('please')) {
        positiveFeedback.push('Clear pronunciation of "please"');
    }
    if (spokenText.includes('books')) {
        positiveFeedback.push('Good job with the word "books"');
    }

    positiveFeedback.push('Your confidence is growing!');

    // Generate suggestions
    const suggestions = [];

    if (!spokenText.includes('twelve')) {
        suggestions.push({
            word: 'twelve',
            tip: 'Try emphasizing the number: "page TWELVE"',
            hasAudio: true
        });
    }

    if (!spokenText.includes('page') && score < 100) {
        suggestions.push({
            word: 'page',
            tip: 'Remember to include "page" before the number',
            hasAudio: false
        });
    }

    if (score < 70) {
        suggestions.push({
            word: 'overall',
            tip: 'Try slowing down a bit for clearer pronunciation',
            hasAudio: false
        });
    }

    // Update positive feedback list
    const positiveList = document.getElementById('positive-feedback');
    positiveList.innerHTML = positiveFeedback.map(item => `<li>${item}</li>`).join('');

    // Update suggestions list
    const suggestionList = document.getElementById('suggestion-feedback');
    suggestionList.innerHTML = suggestions.map(item => `
        <li>
            <strong>${item.word}:</strong> ${item.tip}
            ${item.hasAudio ? `<button class="listen-model-btn" onclick="playModelPronunciation('${item.word}')">🔊 Listen to model</button>` : ''}
        </li>
    `).join('');

    // Update encouragement
    let encouragement = '';
    if (score >= 90) {
        encouragement = 'Outstanding work! You\'re speaking with confidence and clarity. Your students will understand you perfectly. Keep up this excellent progress!';
    } else if (score >= 70) {
        encouragement = 'You\'re making great progress! These small adjustments will help you sound even more natural. Your students will clearly understand your instructions. Keep practicing!';
    } else if (score >= 50) {
        encouragement = 'Good effort! With a bit more practice on those tricky sounds, you\'ll master this. Remember, every attempt helps you improve. You\'re on the right track!';
    } else {
        encouragement = 'Thank you for trying! Learning pronunciation takes time and patience. Listen to the model again and try breaking the sentence into smaller parts. You\'re building important skills!';
    }

    document.getElementById('encouragement-text').textContent = encouragement;
}

// Play model pronunciation
function playModelPronunciation(word) {
    // Use Web Speech API to speak the word
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // Slower for clarity
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    } else {
        alert('Text-to-speech not supported in this browser');
    }
}

// Next lesson
function nextLesson() {
    alert('Next lesson coming soon! This would take you to the next module in the full platform.');
}

// Save progress
function saveProgress() {
    alert('Progress saved! In the full platform, your performance would be tracked in your learning dashboard.');
}
