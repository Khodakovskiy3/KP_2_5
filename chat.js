async function fetchMessages() {
  if (!this.accessToken || !this.roomId) return;
  try {
    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/messages?dir=b&limit=50${this.lastSyncToken ? `&from=${this.lastSyncToken}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    const data = await res.json();
    if (data.chunk) {
      this.messages = data.chunk.filter(msg => msg.type === 'm.room.message' && msg.content && msg.content.body)
        .map(msg => ({
          id: msg.event_id,
          sender: msg.sender,
          body: msg.content.body,
          timestamp: msg.origin_server_ts
        }));
      if (data.end) {
        this.lastSyncToken = data.end;
      }
    }
  } catch (e) {
    console.error('Fetch messages error:', e);
  }
}

async function sendMessage() {
  if (!this.newMessage.trim() || !this.accessToken || !this.roomId) return;
  try {
    const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/send/m.room.message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        msgtype: 'm.text',
        body: this.newMessage.trim()
      })
    });
    if (res.ok) {
      this.newMessage = '';
      this.fetchMessages();
    } else {
      console.error('Send message failed:', await res.json());
    }
  } catch (e) {
    console.error('Send message error:', e);
  }
}

async function joinRoom() {
  if (!this.joinRoomId.trim() || !this.accessToken) return;
  try {
    const res = await fetch(`https://matrix.org/_matrix/client/r0/join/${encodeURIComponent(this.joinRoomId.trim())}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    const data = await res.json();
    if (data.room_id) {
      this.roomId = data.room_id;
      this.joinRoomId = '';
      await this.fetchRoomsWithNames();
      this.fetchMessages();
      alert(`Joined room: ${data.room_id}`);
    } else {
      console.error('Join room failed:', data);
      alert('Join room failed: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('Join room error:', e);
    alert('Join room error: ' + e.message);
  }
}

function getRoomName(roomId) {
  return roomId.split(':').slice(0, -1).join(':').replace(/^!/, '').replace(/^#/, '');
}