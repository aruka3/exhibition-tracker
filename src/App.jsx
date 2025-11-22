import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, MapPin, Plus, Download, X, Camera, ImagePlus } from 'lucide-react';

// Supabase初期化
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'exists' : 'missing');
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  // データベースから展示会を取得
const fetchExhibitions = async () => {
  try {
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    setExhibitions(data || []);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
  }
};
  const [exhibitions, setExhibitions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    priority: 3,
    image: null,
    imagePreview: null
  });

useEffect(() => {
  fetchExhibitions();
}, []);

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (daysRemaining) => {
    if (daysRemaining < 0) return 'bg-gray-300 text-gray-600';
    if (daysRemaining <= 7) return 'bg-red-500 text-white';
    if (daysRemaining <= 30) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusText = (daysRemaining) => {
    if (daysRemaining < 0) return '終了';
    if (daysRemaining === 0) return '今日まで！';
    if (daysRemaining === 1) return '明日まで！';
    return `あと${daysRemaining}日`;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

 const handleSubmit = async () => {
  if (!formData.title || !formData.startDate || !formData.endDate || !formData.location) {
    alert('全ての項目を入力してください');
    return;
  }

  try {
    const { error } = await supabase
      .from('exhibitions')
      .insert([
        {
          title: formData.title,
          start_date: formData.startDate,
          end_date: formData.endDate,
          location: formData.location,
          priority: formData.priority,
          image_url: formData.imagePreview
        }
      ]);

    if (error) throw error;

    // 追加後にデータを再取得
    await fetchExhibitions();
    
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      priority: 3,
      image: null,
      imagePreview: null
    });
    setShowAddForm(false);
  } catch (error) {
    console.error('Error adding exhibition:', error);
    alert('追加に失敗しました');
  }
};
 

  const downloadCalendar = (exhibition) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Exhibition Tracker//JP',
      'BEGIN:VEVENT',
      `UID:${exhibition.id}@exhibitiontracker.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND;VALUE=DATE:${(() => {
  const end = new Date(exhibition.endDate);
  end.setDate(end.getDate() + 1);
  return end.toISOString().split('T')[0].replace(/-/g, '');
})()}`,
      `DTEND;VALUE=DATE:${exhibition.endDate.replace(/-/g, '')}`,
      `SUMMARY:${exhibition.title}`,
      `LOCATION:${exhibition.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exhibition.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openInGoogleCalendar = (exhibition) => {
    const formatDate = (dateStr) => {
      return dateStr.replace(/-/g, '');
    };
    
    const title = encodeURIComponent(exhibition.title);
    const location = encodeURIComponent(exhibition.location);
    const endDate = new Date(exhibition.endDate);
endDate.setDate(endDate.getDate() + 1);
const dates = `${formatDate(exhibition.startDate)}/${endDate.toISOString().split('T')[0].replace(/-/g, '')}`;
    
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&sf=true&output=xml`;
    window.open(googleCalUrl, '_blank');
  };

  const openInGoogleMaps = (location) => {
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const deleteExhibition = (id) => {
    setExhibitions(exhibitions.filter(ex => ex.id !== id));
  };

  const sortedExhibitions = [...exhibitions].sort((a, b) => {
    const daysA = getDaysRemaining(a.endDate);
    const daysB = getDaysRemaining(b.endDate);
    return daysA - daysB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">展示会トラッカー</h1>
          <p className="text-gray-600">気になる展示会を管理しよう</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Plus size={20} />
          展示会を追加
        </button>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">パンフレット写真</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition text-center">
                    <Camera className="mx-auto mb-2 text-gray-400" size={32} />
                    <span className="text-sm text-gray-600">カメラで撮影</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition text-center">
                    <ImagePlus className="mx-auto mb-2 text-gray-400" size={32} />
                    <span className="text-sm text-gray-600">ギャラリーから</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {formData.imagePreview && (
                <div className="mt-3 relative">
                  <img 
                    src={formData.imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFormData({...formData, image: null, imagePreview: null})}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">展示会名</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 印象派展"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">開始日</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">終了日</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">場所</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 東京国立博物館"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">行きたい度</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setFormData({...formData, priority: num})}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      formData.priority >= num
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                追加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {sortedExhibitions.map(exhibition => {
            const daysRemaining = getDaysRemaining(exhibition.endDate);
            const statusColor = getStatusColor(daysRemaining);
            const statusText = getStatusText(daysRemaining);

            return (
              <div key={exhibition.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              {exhibition.image_url && (
  <img 
    src={exhibition.image_url} 
    alt={exhibition.title}
    className="w-full h-48 object-cover"
  />
)}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{exhibition.title}</h3>
                      <button
                        onClick={() => openInGoogleMaps(exhibition.location)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-2"
                      >
                        <MapPin size={16} />
                        <span className="underline">{exhibition.location}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => deleteExhibition(exhibition.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{exhibition.startDate}</span>
                      <span>{exhibition.endDate}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${statusColor.split(' ')[0]}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, 
                            ((new Date() - new Date(exhibition.startDate)) / 
                            (new Date(exhibition.endDate) - new Date(exhibition.startDate))) * 100
                          ))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`${statusColor} px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap`}>
                        {statusText}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < exhibition.priority ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openInGoogleCalendar(exhibition)}
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                      >
                        <Calendar size={16} />
                        Google
                      </button>
                      <button
                        onClick={() => downloadCalendar(exhibition)}
                        className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                      >
                        <Download size={16} />
                        .ics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {exhibitions.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>まだ展示会が登録されていません</p>
            <p className="text-sm">上のボタンから追加してみましょう</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;