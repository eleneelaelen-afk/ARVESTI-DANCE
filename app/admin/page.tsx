// ОТПРАВКА УВЕДОМЛЕНИЙ (ОБЩИЕ ИЛИ ПЕРСОНАЛЬНОЕ)
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    let targetGroupId = 'all';
    let targetStudentId: string | null = null;

    if (notifTarget.startsWith('student:')) {
      targetStudentId = notifTarget.replace('student:', '');
      const st = students.find((s) => s.id === targetStudentId);
      targetGroupId = st?.group_id || 'all';
    } else {
      targetGroupId = notifTarget;
    }

    const newNotif: AppNotificationRow = {
      id: 'notif-' + Date.now(),
      target_group_id: targetGroupId,
      target_student_id: targetStudentId,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications([newNotif, ...notifications]);
    setNotifTitle('');
    setNotifMessage('');
    setNotifSentSuccess(targetStudentId ? 'Личное сообщение отправлено ученице!' : 'Уведомление отправлено!');
    setTimeout(() => setNotifSentSuccess(''), 4000);

    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch {}
  };
