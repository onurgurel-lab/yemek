/**
 * MenuRating.jsx - Yemek Değerlendirme Bileşeni
 *
 * Kullanıcıların yemeklere puan vermesi ve yorum yapmasını sağlar.
 * Bugünün menüsü için değerlendirme yapılabilir.
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
            if (points.length > 0) {
                const avg = points.reduce((sum, p) => sum + (p.point || 0), 0) / points.length;
                setAverageRating(Math.round(avg * 10) / 10);
            } else {
                setAverageRating(0);
            }

            // Find user's existing evaluation
            if (user?.uId) {
                const userPoint = points.find(p => p.uId === user.uId);
                const userCommentItem = comments.find(c => c.uId === user.uId);

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
    }, [menuItem, user]);

    // Load data when modal opens
    useEffect(() => {
        if (visible && menuItem?.id) {
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

        if (!user?.uId) {
            message.error('Kullanıcı bilgisi bulunamadı!');
            return;
        }

        setSubmitting(true);
        try {
            const promises = [];

            // Handle point
            if (userRating > 0) {
                const pointData = {
                    mealMenuId: menuItem.id,
                    userName: user.userName || user.name,
                    point: userRating,
                    uId: user.uId
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
                    userName: user.userName || user.name,
                    comment: userComment.trim(),
                    uId: user.uId
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

    // Render stars for display
    const renderStars = (rating) => {
        return (
            <Rate
                disabled
                value={rating}
                allowHalf
                style={{ fontSize: 16 }}
            />
        );
    };

    return (
        <Modal
            title={
                <Space>
                    {getCategoryIcon(menuItem?.category)}
                    <span>{menuItem?.foodName || 'Yemek Değerlendirme'}</span>
                    <Tag color={getCategoryColor(menuItem?.category)}>
                        {menuItem?.category || 'Diğer'}
                    </Tag>
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
                <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                    <Space direction="vertical" size={4}>
                        <Text type="secondary">
                            <FireOutlined /> Kalori: {menuItem?.calorie || 0} kcal
                        </Text>
                        <Text type="secondary">
                            📅 Tarih: {dayjs(menuItem?.menuDate).format('DD MMMM YYYY')}
                        </Text>
                    </Space>
                </div>

                {/* Ortalama Puan */}
                {allPoints.length > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Space direction="vertical" size={4}>
                            <Text type="secondary">Ortalama Puan</Text>
                            <Space>
                                {renderStars(averageRating)}
                                <Text strong style={{ fontSize: 18 }}>
                                    {averageRating}
                                </Text>
                                <Text type="secondary">
                                    ({allPoints.length} değerlendirme)
                                </Text>
                            </Space>
                        </Space>
                    </div>
                )}

                <Divider />

                {/* Değerlendirme Formu */}
                {!isToday() ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <Text type="warning">
                            ⚠️ Sadece bugünün menüsüne değerlendirme yapabilirsiniz!
                        </Text>
                    </div>
                ) : user ? (
                    <div className="rating-form">
                        {/* Puan Verme */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong>Puan Verin (1-5 yıldız):</Text>
                            <div style={{ marginTop: 8 }}>
                                <Rate
                                    value={userRating}
                                    onChange={handleRatingChange}
                                    tooltips={Object.values(RATING_DESCRIPTIONS)}
                                    style={{ fontSize: 32 }}
                                />
                                {userRating > 0 && (
                                    <Text style={{ marginLeft: 16 }}>
                                        {RATING_DESCRIPTIONS[userRating]}
                                    </Text>
                                )}
                            </div>
                        </div>

                        {/* Yorum */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong>Yorumunuz:</Text>
                            <TextArea
                                value={userComment}
                                onChange={handleCommentChange}
                                placeholder="Bu yemek hakkında düşüncelerinizi paylaşın..."
                                rows={4}
                                maxLength={500}
                                showCount
                                style={{ marginTop: 8 }}
                            />
                        </div>

                        {/* Butonlar */}
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={onClose}>
                                İptal
                            </Button>

                            {isEditing && (existingPoint || existingComment) && (
                                <Popconfirm
                                    title="Değerlendirmeyi silmek istediğinizden emin misiniz?"
                                    onConfirm={handleDelete}
                                    okText="Evet, Sil"
                                    cancelText="İptal"
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
                                icon={isEditing ? <EditOutlined /> : <StarOutlined />}
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={userRating === 0 && !userComment.trim()}
                            >
                                {isEditing ? 'Güncelle' : 'Gönder'}
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <Text type="secondary">
                            Değerlendirme yapabilmek için giriş yapmalısınız.
                        </Text>
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
                                                {comment.uId === user?.uId && (
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

    useEffect(() => {
        const loadRatingData = async () => {
            if (!menuItem?.id) return;

            try {
                const response = await menuPointService.getByMenuId(menuItem.id);
                const points = response?.data || response || [];

                if (points.length > 0) {
                    const avg = points.reduce((sum, p) => sum + (p.point || 0), 0) / points.length;
                    setAverageRating(Math.round(avg * 10) / 10);
                    setRatingCount(points.length);

                    if (user?.uId) {
                        setHasUserRating(points.some(p => p.uId === user.uId));
                    }
                }
            } catch (error) {
                // Silent fail
            }
        };

        loadRatingData();
    }, [menuItem, user]);

    return (
        <Space>
            <Tooltip title={!isToday ? 'Geçmiş tarihlere değerlendirme yapılamaz' : (hasUserRating ? 'Değerlendirmeyi düzenle' : 'Değerlendir')}>
                <Button
                    type={hasUserRating ? 'default' : 'primary'}
                    size="small"
                    icon={hasUserRating ? <StarFilled /> : <StarOutlined />}
                    onClick={onRatingClick}
                    disabled={!isToday && !hasUserRating}
                >
                    {!isToday && hasUserRating ? 'Değerlendirildi' :
                        isToday && hasUserRating ? 'Düzenle' : 'Değerlendir'}
                </Button>
            </Tooltip>

            {ratingCount > 0 && (
                <Badge count={averageRating} showZero style={{ backgroundColor: '#faad14' }}>
                    <Rate disabled value={averageRating} count={1} style={{ fontSize: 16 }} />
                </Badge>
            )}
        </Space>
    );
};

export default MenuRating;