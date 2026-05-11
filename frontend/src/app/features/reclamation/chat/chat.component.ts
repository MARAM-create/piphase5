import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-widget">
      <!-- Bouton flottant -->
      <button class="chat-fab" (click)="toggleChat()" *ngIf="!isOpen">
        🤖
      </button>

      <!-- Fenêtre de chat -->
      <div class="chat-popup" *ngIf="isOpen">
        <div class="chat-header">
          <div class="header-info">
            <h3>🤖 Assistant Locavia</h3>
            <span class="status">En ligne</span>
          </div>
          <button class="close-btn" (click)="toggleChat()">×</button>
        </div>

        <div class="chat-messages" #scrollContainer>
          <div *ngIf="messages.length === 0" class="welcome-msg">
            <p>Bonjour ! Je suis l'assistant IA de Locavia. Comment puis-je vous aider aujourd'hui ?</p>
          </div>
          
          <div *ngFor="let msg of messages" [ngClass]="['message', msg.role]">
            <div class="msg-bubble">
              {{ msg.content }}
              <span class="time">{{ msg.timestamp | date:'HH:mm' }}</span>
            </div>
          </div>

          <div *ngIf="isLoading" class="message assistant">
            <div class="msg-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <input 
            type="text" 
            [(ngModel)]="userMessage" 
            (keyup.enter)="send()" 
            placeholder="Posez votre question..."
            [disabled]="isLoading"
          >
          <button (click)="send()" [disabled]="!userMessage.trim() || isLoading">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-widget {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
    }
    .chat-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1c3d2a 0%, #2d6646 100%);
      color: white;
      border: none;
      font-size: 2.2rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      line-height: 1;
    }
    .chat-fab:hover {
      transform: scale(1.05);
    }
    .chat-popup {
      width: 360px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: absolute;
      bottom: 0;
      right: 0;
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .chat-header {
      padding: 1.2rem;
      background: #1c3d2a;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-header h3 { margin: 0; font-size: 1.1rem; }
    .status { font-size: 0.75rem; opacity: 0.8; }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .chat-messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      background: #f8fafc;
    }
    .message { display: flex; flex-direction: column; }
    .message.user { align-items: flex-end; }
    .message.assistant { align-items: flex-start; }
    .msg-bubble {
      max-width: 85%;
      padding: 0.8rem 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      position: relative;
      line-height: 1.4;
    }
    .user .msg-bubble {
      background: #1c3d2a;
      color: white;
      border-bottom-right-radius: 2px;
    }
    .assistant .msg-bubble {
      background: white;
      color: #334155;
      border-bottom-left-radius: 2px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .time {
      display: block;
      font-size: 0.7rem;
      margin-top: 0.3rem;
      opacity: 0.6;
    }
    .chat-input {
      padding: 1rem;
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .chat-input input {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 0.6rem 1rem;
      outline: none;
      font-size: 0.9rem;
    }
    .chat-input button {
      background: #1c3d2a;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .typing span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      margin: 0 2px;
      animation: bounce 1.4s infinite;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-5px); }
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userMessage = '';
  isLoading = false;
  isOpen = false;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  send() {
    const text = this.userMessage.trim();
    if (!text || this.isLoading) return;

    this.messages.push({
      role: 'user',
      content: text,
      timestamp: new Date()
    });

    this.userMessage = '';
    this.isLoading = true;

    this.chatService.sendMessage(text).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Désolé, une erreur est survenue.',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
