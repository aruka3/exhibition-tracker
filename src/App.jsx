import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Calendar,
  MapPin,
  Plus,
  Download,
  X,
  Camera,
  ImagePlus,
  LogOut,
  Save,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Auth from './components/Auth';

// Supabase初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'exists' : 'missing');
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  // 認証状態
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // データ状態
  const [exhibitions, setExhibitions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState(null);

  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    priority: 3,
    images: [],
    imagePreviews: [],
  });

  // 画像モーダル
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 認証チェック
  useEffect(() => {
    checkUser();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchExhibitions();
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchExhibitions();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // 展示会データ取得
  const fetchExhibitions = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((ex) => ({
        ...ex,
        startDate: ex.start_date,
        endDate: ex.end_date,
        imageUrls: ex.image_urls || [],
      }));

      setExhibitions(mapped);
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setExhibitions([]);
  };

  // 画像アップロード処理
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = [];
    let processedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        processedCount++;

        if (processedCount === files.length) {
          setFormData({
            ...formData,
            images: [...formData.images, ...files],
            imagePreviews: [...formData.imagePreviews, ...newPreviews],
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 画像削除
  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
      imagePreviews: formData.imagePreviews.filter((_, i) => i !== index),
    });
  };

  // 下書き保存
  const handleSaveDraft = async () => {
    if (formData.imagePreviews.length === 0) {
      alert('写真を1枚以上追加してください');
      return;
    }

    try {
      const exhibitionData = {
        title: formData.title || '',
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        location: formData.location || '',
        priority: formData.priority,
        image_urls: formData.imagePreviews,
        status: 'draft',
        user_id: user.id,
      };

      if (editingExhibition) {
        const { error } = await supabase
          .from('exhibitions')
          .update(exhibitionData)
          .eq('id', editingExhibition.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exhibitions')
          .insert([exhibitionData]);

        if (error) throw error;
      }

      await fetchExhibitions();
      resetForm();
      alert('下書きを保存しました');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('保存に失敗しました: ' + error.message);
    }
  };

  // 完成として保存
  const handleSubmitComplete = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location) {
      alert('全ての項目を入力してください');
      return;
    }

    if (formData.imagePreviews.length === 0) {
      alert('写真を1枚以上追加してください');
      return;
    }

    try {
      const exhibitionData = {
        title: formData.title,
        start_date: formData.startDate,
        end_date: formData.endDate,
        location: formData.location,
        priority: formData.priority,
        image_urls: formData.imagePreviews,
        status: 'complete',
        user_id: user.id,
      };

      if (editingExhibition) {
        const { error } = await supabase
          .from('exhibitions')
          .update(exhibitionData)
          .eq('id', editingExhibition.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exhibitions')
          .insert([exhibitionData]);

        if (error) throw error;
      }

      await fetchExhibitions();
      resetForm();
      alert('展示会を登録しました');
    } catch (error) {
      console.error('Error submitting exhibition:', error);
      alert('登録に失敗しました: ' + error.message);
    }
  };

  // 編集開始
  const startEdit = (exhibition) => {
    setEditingExhibition(exhibition);
    setFormData({
      title: exhibition.title || '',
      startDate: exhibition.startDate || '',
      endDate: exhibition.endDate || '',
      location: exhibition.location || '',
      priority: exhibition.priority || 3,
      images: [],
      imagePreviews: exhibition.imageUrls || [],
    });
    setShowAddForm(true);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      priority: 3,
      images: [],
      imagePreviews: [],
    });
    setShowAddForm(false);
    setEditingExhibition(null);
  };

  // 削除
  const deleteExhibition = async (id) => {
    if (!confirm('削除してもよろしいですか？')) return;

    try {
      const { error } = await supabase.from('exhibitions').delete().eq('id', id);

      if (error) throw error;

      await fetchExhibitions();
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      alert('削除に失敗しました');
    }
  };

  // 日数計算
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

  // カレンダーダウンロード
  const downloadCalendar = (exhibition) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Exhibition Gallery//JP',
      'BEGIN:VEVENT',
      `UID:${exhibition.id}@exhibitiongallery.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${exhibition.startDate.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${(() => {
        const end = new Date(exhibition.endDate);
        end.setDate(end.getDate() + 1);
        return end.toISOString().split('T')[0].replace(/-/g, '');
      })()}`,
      `SUMMARY:${exhibition.title}`,
      `LOCATION:${exhibition.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
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

  // Google Calendar連携
  const openInGoogleCalendar = (exhibition) => {
    const formatDate = (dateStr) => dateStr.replace(/-/g, '');
    const title = encodeURIComponent(exhibition.title);
    const location = encodeURIComponent(exhibition.location);
    const endDate = new Date(exhibition.endDate);
    endDate.setDate(endDate.getDate() + 1);
    const dates = `${formatDate(exhibition.startDate)}/${endDate
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '')}`;

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&sf=true&output=xml`;
    window.open(googleCalUrl, '_blank');
  };

  // Google Maps連携
  const openInGoogleMaps = (location) => {
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // 画像モーダル
  const openImageModal = (images, index) => {
    setSelectedImage(images);
    setCurrentImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImage.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImage.length) % selectedImage.length);
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return <Auth supabase={supabase} onAuthSuccess={setUser} />;
  }

  // 下書きと完成を分離
  const draftExhibitions = exhibitions.filter((ex) => ex.status === 'draft');
  const completeExhibitions = exhibitions
    .filter((ex) => ex.status === 'complete')
    .sort((a, b) => getDaysRemaining(a.endDate) - getDaysRemaining(b.endDate));

  // メインコンテンツ
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Exhibition Gallery</h1>
          <p className="text-gray-600 mb-4">展示会を美しく管理</p>
          <div className="flex justify-center items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        </div>

        {/* 追加ボタン */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
        >
          <Plus size={22} />
          {editingExhibition ? '編集中' : '展示会を追加'}
        </button>

        {/* フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            {/* 画像アップロード */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">
                パンフレット写真（複数選択可）
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-500 transition text-center">
                    <Camera className="mx-auto mb-2 text-gray-400" size={36} />
                    <span className="text-sm text-gray-600">カメラで撮影</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-500 transition text-center">
                    <ImagePlus className="mx-auto mb-2 text-gray-400" size={36} />
                    <span className="text-sm text-gray-600">ギャラリーから</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 画像プレビュー */}
              {formData.imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 展示会名 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">展示会名</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 印象派展"
              />
            </div>

            {/* 日程 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-3">開始日</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-3">終了日</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* 場所 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">場所</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例: 東京国立博物館"
              />
            </div>

            {/* 優先度 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">行きたい度</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFormData({ ...formData, priority: num })}
                    className={`flex-1 py-3 rounded-lg font-semibold transition ${
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

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Save size={18} />
                下書き保存
              </button>
              <button
                onClick={handleSubmitComplete}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                完成
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 下書き一覧 */}
        {draftExhibitions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">下書き中</h2>
            <div className="space-y-4">
              {draftExhibitions.map((exhibition) => (
                <ExhibitionCard
                  key={exhibition.id}
                  exhibition={exhibition}
                  onEdit={startEdit}
                  onDelete={deleteExhibition}
                  onImageClick={openImageModal}
                  openInGoogleCalendar={openInGoogleCalendar}
                  openInGoogleMaps={openInGoogleMaps}
                  downloadCalendar={downloadCalendar}
                  getDaysRemaining={getDaysRemaining}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  isDraft={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* 登録済み一覧 */}
        {completeExhibitions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">登録済み</h2>
            <div className="space-y-4">
              {completeExhibitions.map((exhibition) => (
                <ExhibitionCard
                  key={exhibition.id}
                  exhibition={exhibition}
                  onEdit={startEdit}
                  onDelete={deleteExhibition}
                  onImageClick={openImageModal}
                  openInGoogleCalendar={openInGoogleCalendar}
                  openInGoogleMaps={openInGoogleMaps}
                  downloadCalendar={downloadCalendar}
                  getDaysRemaining={getDaysRemaining}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  isDraft={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* 空の状態 */}
        {exhibitions.length === 0 && !showAddForm && (
          <div className="text-center py-16 text-gray-500">
            <Calendar size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">まだ展示会が登録されていません</p>
            <p className="text-sm">上のボタンから追加してみましょう</p>
          </div>
        )}
      </div>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>

          {selectedImage.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft size={48} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight size={48} />
              </button>
            </>
          )}

          <img
            src={selectedImage[currentImageIndex]}
            alt="拡大表示"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {selectedImage.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {currentImageIndex + 1} / {selectedImage.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 展示会カードコンポーネント
const ExhibitionCard = ({
  exhibition,
  onEdit,
  onDelete,
  onImageClick,
  openInGoogleCalendar,
  openInGoogleMaps,
  downloadCalendar,
  getDaysRemaining,
  getStatusColor,
  getStatusText,
  isDraft,
}) => {
  const daysRemaining = exhibition.endDate ? getDaysRemaining(exhibition.endDate) : null;
  const statusColor = daysRemaining !== null ? getStatusColor(daysRemaining) : '';
  const statusText = daysRemaining !== null ? getStatusText(daysRemaining) : '';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      {/* 画像ギャラリー */}
      {exhibition.imageUrls && exhibition.imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-1 bg-gray-100">
          {exhibition.imageUrls.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className="relative cursor-pointer hover:opacity-90 transition"
              onClick={() => onImageClick(exhibition.imageUrls, index)}
            >
              <img
                src={url}
                alt={`${exhibition.title} ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              {index === 3 && exhibition.imageUrls.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold">
                  +{exhibition.imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {exhibition.title || '（タイトル未設定）'}
            </h3>
            {exhibition.location && (
              <button
                onClick={() => openInGoogleMaps(exhibition.location)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                <MapPin size={16} />
                <span className="underline">{exhibition.location}</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(exhibition)}
              className="text-gray-400 hover:text-blue-500 transition"
            >
              編集
            </button>
            <button
              onClick={() => onDelete(exhibition.id)}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 日程バー */}
        {exhibition.startDate && exhibition.endDate && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{exhibition.startDate}</span>
              <span>{exhibition.endDate}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColor.split(' ')[0]}`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((new Date() - new Date(exhibition.startDate)) /
                        (new Date(exhibition.endDate) - new Date(exhibition.startDate))) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {!isDraft && daysRemaining !== null && (
              <span
                className={`${statusColor} px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap`}
              >
                {statusText}
              </span>
            )}
            {isDraft && (
              <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                下書き
              </span>
            )}
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < exhibition.priority ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {!isDraft && exhibition.title && exhibition.location && exhibition.startDate && exhibition.endDate && (
            <div className="flex gap-2">
              <button
                onClick={() => openInGoogleCalendar(exhibition)}
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              >
                <Calendar size={16} />
                Google
              </button>
              <button
                onClick={() => downloadCalendar(exhibition)}
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              >
                <Download size={16} />
                .ics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
