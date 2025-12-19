/**
 * DayEvaluationModal.jsx - Günlük Hizmet Değerlendirme Modal
 *
 * Kullanıcıların günün genel yemek hizmetini değerlendirmesini sağlar.
 * Sadece bugün için değerlendirme yapılabilir.
 *
 * @module pages/Yemekhane/components/DayEvaluationModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Rate,
    Input,
    Button,
    Space,
    Typography,
    message,
    Spin,
    Popconfirm,
    Alert,
    Divider
} from 'antd';
import {
    CalendarOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    StarOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { dayPointService, dayCommentService } from '@/services/evaluationService';
import { RATING_DESCRIPTIONS } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

/**
 * DayEvaluationModal - Günlük Değerlendirme Modal
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal görünürlüğü
 * @param {Function} props.onClose - Modal kapatma
 * @param {string} props.date - Değerlendirme tarihi (YYYY-MM-DD)
 * @param {Function} props.onUpdate - Güncelleme callback
 */
const DayEvaluationModal = ({ visible, onClose, date, onUpdate }) => {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [existingPoint, setExistingPoint] = useState(null);
    const [existingComment, setExistingComment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [canEvaluate, setCanEvaluate] = useState(true);

    // Check if selected date is today
    const isToday = useCallback(() => {
        if (!date) return false;
        return dayjs(date).isSame(dayjs(), 'day');
    }, [date]);

    // Format date for display
    const formatDisplayDate = useCallback(() => {
        if (!date) return '';
        return dayjs(date).format('DD MMMM YYYY dddd');
    }, [date]);

    // Check evaluation permissions
    const checkPermissions = useCallback(() => {
        const today = isToday();
        setCanEvaluate(today);
    }, [isToday]);

    // Load existing evaluation
    const loadData = useCallback(async () => {
        if (!date || !user?.uId) return;

        setLoading(true);
        try {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');

            // Load user's existing evaluation for this date
            const [pointsRes, commentsRes] = await Promise.allSettled([
                dayPointService.getByUser(user.uId),
                dayCommentService.getByUser(user.uId)
            ]);

            // Find point for this date
            if (pointsRes.status === 'fulfilled' && pointsRes.value) {
                const points = pointsRes.value?.data || pointsRes.value || [];
                const pointsArray = Array.isArray(points) ? points : [];
                const userPoint = pointsArray.find(p => {
                    const pointDate = dayjs(p.pointDate).format('YYYY-MM-DD');
                    return pointDate === formattedDate;
                });

                if (userPoint) {
                    setExistingPoint(userPoint);
                    setUserRating(userPoint.point || 0);
                    setIsEditing(true);
                } else {
                    setExistingPoint(null);
                    setUserRating(0);
                    setIsEditing(false);
                }
            }

            // Find comment for this date
            if (commentsRes.status === 'fulfilled' && commentsRes.value) {
                const comments = commentsRes.value?.data || commentsRes.value || [];
                const commentsArray = Array.isArray(comments) ? comments : [];
                const userCommentItem = commentsArray.find(c => {
                    const commentDate = dayjs(c.commentDate).format('YYYY-MM-DD');
                    return commentDate === formattedDate;
                });

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
            console.error('Mevcut değerlendirmeler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [date, user]);

    // Load data when modal opens
    useEffect(() => {
        if (visible && date) {
            checkPermissions();
            loadData();
        }
    }, [visible, date, checkPermissions, loadData]);

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setUserRating(0);
            setUserComment('');
            setExistingPoint(null);
            setExistingComment(null);
            setIsEditing(false);
            setCanEvaluate(true);
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
        if (!canEvaluate) {
            message.warning('Sadece bugünü değerlendirebilirsiniz!');
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
            const formattedDate = dayjs(date).format('YYYY-MM-DD');
            const promises = [];

            // Handle point
            if (userRating > 0) {
                if (existingPoint) {
                    promises.push(dayPointService.update({
                        id: existingPoint.id,
                        point: userRating
                    }));
                } else {
                    promises.push(dayPointService.add({
                        pointDate: date,
                        userName: user.userName || user.name,
                        uId: user.uId,
                        point: userRating
                    }));
                }
            }

            // Handle comment
            if (userComment.trim()) {
                if (existingComment) {
                    promises.push(dayCommentService.update({
                        id: existingComment.id,
                        comment: userComment.trim()
                    }));
                } else {
                    promises.push(dayCommentService.add({
                        commentDate: date,
                        userName: user.userName || user.name,
                        uId: user.uId,
                        comment: userComment.trim()
                    }));
                }
            } else if (existingComment) {
                // Remove comment if cleared
                promises.push(dayCommentService.delete(existingComment.id));
            }

            await Promise.all(promises);

            message.success(isEditing ? 'Değerlendirme güncellendi!' : 'Değerlendirme kaydedildi!');
            setIsEditing(true);
            loadData();
            onUpdate?.();
            onClose();
        } catch (error) {
            console.error('Değerlendirme kaydedilirken hata:', error);
            message.error('Değerlendirme kaydedilemedi!');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete evaluation
    const handleDelete = async () => {
        if (!canEvaluate) {
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
                promises.push(dayPointService.delete(existingPoint.id));
            }
            if (existingComment) {
                promises.push(dayCommentService.delete(existingComment.id));
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
            onClose();
        } catch (error) {
            console.error('Değerlendirme silinirken hata:', error);
            message.error('Değerlendirme silinemedi!');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <CalendarOutlined />
                    <span>{isEditing ? 'Değerlendirmeyi Düzenle' : 'Günün Hizmetini Değerlendir'}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {/* Tarih Bilgisi */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 24,
                    padding: 16,
                    background: '#f0f5ff',
                    borderRadius: 8
                }}>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                        {formatDisplayDate()}
                    </Title>
                    <Text type="secondary">
                        {canEvaluate
                            ? (isEditing ? 'Değerlendirmenizi güncelleyebilirsiniz' : 'Bu günün yemek hizmeti hakkında görüşlerinizi paylaşın')
                            : 'Bu tarihi değerlendiremezsiniz'
                        }
                    </Text>
                </div>

                {/* Uyarı - Bugün Değil */}
                {!canEvaluate && (
                    <Alert
                        message="Değerlendirme Yapılamaz"
                        description="Sadece bugünün menüsünü değerlendirebilirsiniz."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                {/* Değerlendirme Formu */}
                {canEvaluate && user && (
                    <>
                        {/* Puan Verme */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>
                                <StarOutlined /> Hizmet Puanı:
                            </Text>
                            <div style={{ textAlign: 'center' }}>
                                <Rate
                                    value={userRating}
                                    onChange={handleRatingChange}
                                    tooltips={Object.values(RATING_DESCRIPTIONS)}
                                    style={{ fontSize: 36 }}
                                />
                                {userRating > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong style={{ color: '#faad14', fontSize: 16 }}>
                                            {RATING_DESCRIPTIONS[userRating]}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Divider />

                        {/* Yorum */}
                        <div style={{ marginBottom: 24 }}>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>
                                Yorumunuz:
                            </Text>
                            <TextArea
                                value={userComment}
                                onChange={handleCommentChange}
                                placeholder="Bugünün yemek hizmeti hakkında düşüncelerinizi yazın..."
                                rows={4}
                                maxLength={500}
                                showCount
                            />
                        </div>

                        <Divider />

                        {/* Butonlar */}
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={onClose} disabled={submitting}>
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
                                icon={isEditing ? <CheckCircleOutlined /> : <StarOutlined />}
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={userRating === 0 && !userComment.trim()}
                            >
                                {isEditing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </Space>
                    </>
                )}

                {/* Kullanıcı Giriş Yapmamış */}
                {!user && (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <Text type="secondary">
                            Değerlendirme yapabilmek için giriş yapmalısınız.
                        </Text>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default DayEvaluationModal;