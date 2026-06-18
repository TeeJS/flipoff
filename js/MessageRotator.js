import { DEFAULT_MESSAGES, TOTAL_TRANSITION } from './constants.js';

const DEFAULT_MESSAGE_DURATION_SECONDS = 4;

export class MessageRotator {
  constructor(board, { messages = DEFAULT_MESSAGES, alignments = [], messageDurationSeconds = DEFAULT_MESSAGE_DURATION_SECONDS, shuffle = false } = {}) {
    this.board = board;
    this.messages = messages.map((message) => [...message]);
    this.alignments = alignments.length ? [...alignments] : messages.map(() => 'center');
    this.messageDurationSeconds = Number(messageDurationSeconds) || DEFAULT_MESSAGE_DURATION_SECONDS;
    this.shuffle = Boolean(shuffle);
    this.currentIndex = -1;
    this._lastIndex = -1;
    this._order = [];
    this._orderPos = -1;
    this._timer = null;
    this._paused = false;
    this._remoteOverride = false;
    this._buildOrder();
  }

  // Build the play order for one cycle. Sequential by default; a fresh shuffled
  // permutation each cycle when shuffle (?shuffle=1) is on, avoiding an
  // immediate repeat of the screen that just played.
  _buildOrder() {
    const n = this.messages.length;
    const order = Array.from({ length: n }, (_, i) => i);
    if (this.shuffle && n > 1) {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      if (order[0] === this._lastIndex) {
        [order[0], order[1]] = [order[1], order[0]];
      }
    }
    this._order = order;
    this._orderPos = -1;
  }

  start({ immediate = true } = {}) {
    if (immediate) {
      this.next();
    }

    this._paused = false;
    this._ensureTimer();
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  next(options = {}) {
    if (this._remoteOverride || this.messages.length === 0) return;

    this._orderPos += 1;
    if (this._orderPos >= this._order.length) {
      this._buildOrder();        // start a new cycle (reshuffled when shuffle is on)
      this._orderPos = 0;
    }
    this.currentIndex = this._order[this._orderPos];
    this._lastIndex = this.currentIndex;
    this.board.displayMessage(this.messages[this.currentIndex], { alignment: this.alignments[this.currentIndex] || 'center', ...options });
    this._resetAutoRotation();
  }

  prev(options = {}) {
    if (this._remoteOverride || this.messages.length === 0) return;

    this._orderPos -= 1;
    if (this._orderPos < 0) {
      this._orderPos = this._order.length - 1;
    }
    this.currentIndex = this._order[this._orderPos];
    this._lastIndex = this.currentIndex;
    this.board.displayMessage(this.messages[this.currentIndex], { alignment: this.alignments[this.currentIndex] || 'center', ...options });
    this._resetAutoRotation();
  }

  setMessages(messages, alignments = []) {
    this.messages = Array.isArray(messages) ? messages.map((message) => [...message]) : [];
    this.alignments = alignments.length ? [...alignments] : this.messages.map(() => 'center');
    this._lastIndex = -1;
    this._buildOrder();
    this.currentIndex = -1;
  }

  setBoard(board) {
    this.board = board;
  }

  setMessageDurationSeconds(messageDurationSeconds) {
    this.messageDurationSeconds = Number(messageDurationSeconds) || DEFAULT_MESSAGE_DURATION_SECONDS;
    this._resetAutoRotation();
  }

  getCurrentMessage() {
    if (this.currentIndex < 0 || this.currentIndex >= this.messages.length) {
      return null;
    }

    return [...this.messages[this.currentIndex]];
  }

  hasStarted() {
    return this._timer !== null || this.currentIndex !== -1;
  }

  enableRemoteOverride() {
    this._remoteOverride = true;
    this._paused = true;
  }

  disableRemoteOverride({ showNextMessage = true, interrupt = false } = {}) {
    this._remoteOverride = false;
    this._paused = false;
    this._ensureTimer();

    if (showNextMessage) {
      this.next({ interrupt });
      return;
    }

    this._resetAutoRotation();
  }

  _ensureTimer() {
    if (this._timer) return;

    this._timer = setInterval(() => {
      if (!this._paused && !this.board.isTransitioning) {
        this.next();
      }
    }, (this.messageDurationSeconds * 1000) + TOTAL_TRANSITION);
  }

  _resetAutoRotation() {
    // Reset timer when user manually navigates
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      this._ensureTimer();
    }
  }
}
