/**
 * MenuRating.jsx - Yemek Değerlendirme Bileşeni
 *
 * Kullanıcıların yemeklere puan vermesi ve yorum yapmasını sağlar.
 * Bugünün menüsü için değerlendirme yapılabilir.
 *
 * ✅ FIX: user.id || user.uId kullanılarak userId uyumsuzluğu giderildi
 *
 * @module pages/Yemekhane/components/MenuRating
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Rate,
    Input,
    Button,
    List,
    Avatar,
    Space,
    Typography,
    message,
    Spin,
    Empty,
    Popconfirm,
    Tag,
    Tooltip,
    Badge,
    Divider
} from 'antd';
import {
    StarOutlined,
    StarFilled,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    CommentOutlined,
    FireOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { menuPointService, menuCommentService } from '@/services/evaluationService';
import { RATING_DESCRIPTIONS, getCategoryColor, getCategoryIcon } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

/**
 * MenuRating - Yemek Değerlendirme Modal
 *
 * @param {Object} props
 * @param {Object} props.menuItem - Menü öğesi
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma
 * @param {Function} props.onUpdate - Güncelleme callback
 */
const MenuRating = ({ menuItem, visible, onClose, onUpdate }) => {
    const { user } = useAuth();

    // ✅ FIX: userId'yi doğru şekilde al (id veya uId)
    const userId = user?.id || user?.uId;
    const userName = user?.userName || user?.fullName || user?.name || 'Kullanıcı';

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [existingPoint, setExistingPoint] = useState(null);
    const [existingComment, setExistingComment] = useState(null);
    const [allPoints, setAllPoints] = useState([]);
    const [allComments, setAllComments] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    // Check if menu date is today
    const isToday = useCallback(() => {
        if (!menuItem?.menuDate) return false;
        return dayjs(menuItem.menuDate).isSame(dayjs(), 'day');
    }, [menuItem]);

    // Load existing data
    const loadData = useCallback(async () => {
        if (!menuItem?.id) return;

        setLoading(true);
        try {
            // Load all points and comments for this menu
            const [pointsRes, commentsRes] = await Promise.all([
                menuPointService.getByMenuId(menuItem.id).catch(() => ({ data: [] })),
                menuCommentService.getByMenuId(menuItem.id).catch(() => ({ data: [] }))
            ]);

            const points = pointsRes?.data || pointsRes || [];
            const comments = commentsRes?.data || commentsRes || [];

            setAllPoints(Array.isArray(points) ? points : []);
            setAllComments(Array.isArray(comments) ? comments : []);

            // Calculate average rating
            if (Array.isArray(points) && points.length > 0) {
                const avg = points.reduce((sum, p) => sum + (p.point || 0), 0) / points.length;
                setAverageRating(Math.round(avg * 10) / 10);
            } else {
                setAverageRating(0);
            }

            // Find user's existing evaluation
            if (userId) {
                const userPoint = Array.isArray(points)
                    ? points.find(p => p.uId === userId)
                    : null;
                const userCommentItem = Array.isArray(comments)
                    ? comments.find(c => c.uId === userId)
                    : null;

                if (userPoint) {
                    setExistingPoint(userPoint);
                    setUserRating(userPoint.point || 0);
                    setIsEditing(true);
                } else {
                    setExistingPoint(null);
                    setUserRating(0);
                    setIsEditing(false);
                }

                if (userCommentItem) {
                    setExistingComment(userCommentItem);
                    setUserComment(userCommentItem.comment || '');
                    setIsEditing(true);
                } else {
                    setExistingComment(null);
                    setUserComment('');
                }
            }
        } catch (error) {
            console.error('Değerlendirmeler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [menuItem, userId]);

    // Load data when modal opens
    useEffect(() => {
        if (visible && menuItem) {
            loadData();
        }
    }, [visible, menuItem, loadData]);

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setUserRating(0);
            setUserComment('');
            setExistingPoint(null);
            setExistingComment(null);
            setAllPoints([]);
            setAllComments([]);
            setAverageRating(0);
            setIsEditing(false);
        }
    }, [visible]);

    // Handle rating change
    const handleRatingChange = (value) => {
        setUserRating(value);
    };

    // Handle comment change
    const handleCommentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 500) {
            setUserComment(value);
        }
    };

    // Submit evaluation
    const handleSubmit = async () => {
        if (!isToday()) {
            message.warning('Sadece bugünün menüsünü değerlendirebilirsiniz!');
            return;
        }

        if (userRating === 0 && !userComment.trim()) {
            message.warning('Lütfen en az bir puan verin veya yorum yazın!');
            return;
        }

        // ✅ FIX: userId kontrolü
        if (!userId) {
            message.error('Kullanıcı bilgisi bulunamadı! Lütfen tekrar giriş yapın.');
            return;
        }

        setSubmitting(true);
        try {
            const promises = [];

            // Handle point
            if (userRating > 0) {
                const pointData = {
                    mealMenuId: menuItem.id,
                    userName: userName,
                    point: userRating,
                    uId: userId  // ✅ API'nin beklediği alan adı
                };

                if (existingPoint) {
                    promises.push(menuPointService.update({
                        id: existingPoint.id,
                        point: userRating
                    }));
                } else {
                    promises.push(menuPointService.add(pointData));
                }
            }

            // Handle comment
            if (userComment.trim()) {
                const commentData = {
                    mealMenuId: menuItem.id,
                    userName: userName,
                    comment: userComment.trim(),
                    uId: userId  // ✅ API'nin beklediği alan adı
                };

                if (existingComment) {
                    promises.push(menuCommentService.update({
                        id: existingComment.id,
                        comment: userComment.trim()
                    }));
                } else {
                    promises.push(menuCommentService.add(commentData));
                }
            }

            await Promise.all(promises);

            message.success(isEditing ? 'Değerlendirme güncellendi!' : 'Değerlendirme kaydedildi!');
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Değerlendirme kaydedilirken hata:', error);
            message.error('Değerlendirme kaydedilemedi!');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete evaluation
    const handleDelete = async () => {
        if (!isToday()) {
            message.warning('Sadece bugünün değerlendirmesini silebilirsiniz!');
            return;
        }

        if (!existingPoint && !existingComment) {
            message.warning('Silinecek değerlendirme bulunamadı!');
            return;
        }

        setSubmitting(true);
        try {
            const promises = [];

            if (existingPoint) {
                promises.push(menuPointService.delete(existingPoint.id));
            }
            if (existingComment) {
                promises.push(menuCommentService.delete(existingComment.id));
            }

            await Promise.all(promises);

            message.success('Değerlendirme silindi!');
            setUserRating(0);
            setUserComment('');
            setExistingPoint(null);
            setExistingComment(null);
            setIsEditing(false);
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Değerlendirme silinirken hata:', error);
            message.error('Değerlendirme silinemedi!');
        } finally {
            setSubmitting(false);
        }
    };

    // Can user evaluate
    const canEvaluate = isToday() && userId;

    return (
        <Modal
            title={
                <Space>
                    <span>{getCategoryIcon(menuItem?.category)}</span>
                    <span>{menuItem?.foodName || 'Yemek Değerlendirme'}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {/* Yemek Bilgisi */}
                <div style={{
                    marginBottom: 24,
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 8
                }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                            <Tag color={getCategoryColor(menuItem?.category)}>
                                {menuItem?.category}
                            </Tag>
                            {(menuItem?.calories || menuItem?.calorie) > 0 && (
                                <Tag icon={<FireOutlined />} color="orange">
                                    {menuItem?.calories || menuItem?.calorie} kcal
                                </Tag>
                            )}
                        </Space>

                        <Space>
                            <Text type="secondary">
                                Tarih: {dayjs(menuItem?.menuDate).format('DD MMMM YYYY')}
                            </Text>
                            {isToday() && <Badge status="success" text="Bugün" />}
                        </Space>

                        {averageRating > 0 && (
                            <Space>
                                <Rate disabled value={averageRating} allowHalf />
                                <Text strong>{averageRating.toFixed(1)}</Text>
                                <Text type="secondary">({allPoints.length} değerlendirme)</Text>
                            </Space>
                        )}
                    </Space>
                </div>

                {/* Değerlendirme Bölümü */}
                {canEvaluate ? (
                    <>
                        {/* Puanlama */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                <StarOutlined /> Puanınız
                            </Text>
                            <div style={{ textAlign: 'center' }}>
                                <Rate
                                    value={userRating}
                                    onChange={handleRatingChange}
                                    style={{ fontSize: 32 }}
                                />
                                {userRating > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary">
                                            {RATING_DESCRIPTIONS?.[userRating] || `${userRating} Yıldız`}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Yorum */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                <EditOutlined /> Yorumunuz (Opsiyonel)
                            </Text>
                            <TextArea
                                value={userComment}
                                onChange={handleCommentChange}
                                placeholder="Görüşlerinizi paylaşın..."
                                rows={3}
                                maxLength={500}
                                showCount
                            />
                        </div>

                        {/* Butonlar */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 24 }}>
                            {isEditing && (existingPoint || existingComment) && (
                                <Popconfirm
                                    title="Değerlendirmeyi silmek istediğinize emin misiniz?"
                                    onConfirm={handleDelete}
                                    okText="Evet, Sil"
                                    cancelText="Vazgeç"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={submitting}
                                    >
                                        Sil
                                    </Button>
                                </Popconfirm>
                            )}

                            <Button
                                type="primary"
                                icon={<StarFilled />}
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={userRating === 0 && !userComment.trim()}
                            >
                                {isEditing ? 'Güncelle' : 'Değerlendir'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: 24,
                        background: '#fff7e6',
                        borderRadius: 8,
                        marginBottom: 24
                    }}>
                        {!userId ? (
                            <Text type="warning">
                                Değerlendirme yapabilmek için lütfen giriş yapın.
                            </Text>
                        ) : (
                            <Text type="warning">
                                Sadece bugünün menüsünü değerlendirebilirsiniz.
                            </Text>
                        )}
                    </div>
                )}

                <Divider />

                {/* Tüm Yorumlar */}
                <div className="all-comments">
                    <Title level={5}>
                        <CommentOutlined /> Yorumlar ({allComments.length})
                    </Title>

                    {allComments.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={allComments}
                            renderItem={(comment) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar icon={<UserOutlined />} />
                                        }
                                        title={
                                            <Space>
                                                <Text strong>{comment.userName}</Text>
                                                {comment.uId === userId && (
                                                    <Tag color="blue" size="small">Siz</Tag>
                                                )}
                                            </Space>
                                        }
                                        description={comment.comment}
                                    />
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Empty
                            description="Henüz yorum yapılmamış"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            </Spin>
        </Modal>
    );
};

/**
 * MenuRatingButton - Menü listesinde gösterilen değerlendirme butonu
 *
 * @param {Object} props
 * @param {Object} props.menuItem - Menü öğesi
 * @param {boolean} props.isToday - Bugün mü
 * @param {Function} props.onRatingClick - Tıklama callback
 */
export const MenuRatingButton = ({ menuItem, isToday, onRatingClick }) => {
    const { user } = useAuth();
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [hasUserRating, setHasUserRating] = useState(false);

    // ✅ FIX: userId'yi doğru şekilde al
    const userId = user?.id || user?.uId;

    useEffect(() => {
        const loadRatingData = async () => {
            if (!menuItem?.id) return;

            try {
                const response = await menuPointService.getByMenuId(menuItem.id);
                const points = response?.data || response || [];

                if (Array.isArray(points) && points.length > 0) {
                    const avg = points.reduce((sum, p) => sum + (p.point || 0), 0) / points.length;
                    setAverageRating(Math.round(avg * 10) / 10);
                    setRatingCount(points.length);

                    if (userId) {
                        setHasUserRating(points.some(p => p.uId === userId));
                    }
                }
            } catch (error) {
                // Silent fail
            }
        };

        loadRatingData();
    }, [menuItem, userId]);

    return (
        <Space>
            <Tooltip title={!isToday ? 'Sadece bugünün menüsünü değerlendirebilirsiniz' : 'Değerlendir'}>
                <Button
                    type={hasUserRating ? 'primary' : 'default'}
                    size="small"
                    icon={hasUserRating ? <StarFilled /> : <StarOutlined />}
                    onClick={() => onRatingClick(menuItem)}
                    disabled={!isToday}
                >
                    {averageRating > 0 ? averageRating.toFixed(1) : 'Değerlendir'}
                </Button>
            </Tooltip>
            {ratingCount > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    ({ratingCount})
                </Text>
            )}
        </Space>
    );
};

export default MenuRating;