import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Rate, Input, Button, Space, Typography, message, Spin, Popconfirm, Alert } from 'antd';
import { CalendarOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { dayPointService, dayCommentService } from '@/services/evaluationService';
import { RATING_DESCRIPTIONS } from '@/constants/mealMenuApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

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

    // Load existing evaluation
    const loadData = useCallback(async () => {
        if (!date || !user?.uId) return;

        setLoading(true);
        try {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');

            // Load user's existing evaluation for this date
            const [pointsRes, commentsRes] = await Promise.all([
                dayPointService.getByDate(formattedDate),
                dayCommentService.getByDate(formattedDate)
            ]);

            const points = pointsRes?.data || [];
            const comments = commentsRes?.data || [];

            // Find user's evaluation
            const userPoint = points.find(p => p.uId === user.uId);
            const userCommentData = comments.find(c => c.uId === user.uId);

            if (userPoint) {
                setExistingPoint(userPoint);
                setUserRating(userPoint.point || 0);
            } else {
                setExistingPoint(null);
                setUserRating(0);
            }

            if (userCommentData) {
                setExistingComment(userCommentData);
                setUserComment(userCommentData.comment || '');
            } else {
                setExistingComment(null);
                setUserComment('');
            }

            setIsEditing(false);
        } catch (error) {
            console.error('Gün değerlendirmesi yüklenirken hata:', error);
            message.error('Değerlendirme yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [date, user]);

    useEffect(() => {
        if (visible && date) {
            loadData();
        }
    }, [visible, date, loadData]);

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
            message.warning('Sadece bugünü değerlendirebilirsiniz');
            return;
        }

        if (userRating === 0) {
            message.warning('Lütfen bir puan verin');
            return;
        }

        setSubmitting(true);
        try {
            const formattedDate = dayjs(date).format('YYYY-MM-DD');

            // Handle point
            if (existingPoint) {
                await dayPointService.updatePoint(existingPoint.id, {
                    point: userRating,
                    menuDate: formattedDate
                });
            } else {
                await dayPointService.addPoint({
                    point: userRating,
                    menuDate: formattedDate
                });
            }

            // Handle comment if provided
            if (userComment.trim()) {
                if (existingComment) {
                    await dayCommentService.updateComment(existingComment.id, {
                        comment: userComment.trim(),
                        menuDate: formattedDate
                    });
                } else {
                    await dayCommentService.addComment({
                        comment: userComment.trim(),
                        menuDate: formattedDate
                    });
                }
            } else if (existingComment) {
                // Remove comment if cleared
                await dayCommentService.deleteComment(existingComment.id);
            }

            message.success(existingPoint ? 'Gün değerlendirmesi güncellendi' : 'Gün değerlendirmesi kaydedildi');
            setIsEditing(false);
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Gün değerlendirmesi kaydedilirken hata:', error);
            message.error('Değerlendirme kaydedilemedi');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete evaluation
    const handleDelete = async () => {
        if (!isToday()) {
            message.warning('Sadece bugünün değerlendirmesini silebilirsiniz');
            return;
        }

        setSubmitting(true);
        try {
            if (existingPoint) {
                await dayPointService.deletePoint(existingPoint.id);
            }
            if (existingComment) {
                await dayCommentService.deleteComment(existingComment.id);
            }

            message.success('Gün değerlendirmesi silindi');
            setUserRating(0);
            setUserComment('');
            setExistingPoint(null);
            setExistingComment(null);
            setIsEditing(false);
            loadData();
            onUpdate?.();
        } catch (error) {
            console.error('Gün değerlendirmesi silinirken hata:', error);
            message.error('Değerlendirme silinemedi');
        } finally {
            setSubmitting(false);
        }
    };

    // Start editing
    const handleStartEdit = () => {
        if (!isToday()) {
            message.warning('Sadece bugünün değerlendirmesini düzenleyebilirsiniz');
            return;
        }
        setIsEditing(true);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        if (existingPoint) {
            setUserRating(existingPoint.point || 0);
        } else {
            setUserRating(0);
        }
        if (existingComment) {
            setUserComment(existingComment.comment || '');
        } else {
            setUserComment('');
        }
        setIsEditing(false);
    };

    // Get rating description
    const getRatingDesc = (value) => {
        return RATING_DESCRIPTIONS[value] || '';
    };

    const canEvaluate = isToday();
    const hasExistingEvaluation = existingPoint !== null;
    const showForm = canEvaluate && (isEditing || !hasExistingEvaluation);

    return (
        <Modal
            title={
                <Space>
                    <CalendarOutlined />
                    <span>Gün Değerlendirmesi</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            destroyOnClose
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div>
                    {/* Date Display */}
                    <div style={{ textAlign: 'center', marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            {formatDisplayDate()}
                        </Title>
                        {isToday() && (
                            <Text type="success" style={{ marginTop: 8, display: 'block' }}>
                                <CheckCircleOutlined /> Bugün
                            </Text>
                        )}
                    </div>

                    {/* Not Today Warning */}
                    {!canEvaluate && (
                        <Alert
                            message="Değerlendirme Yapılamaz"
                            description="Sadece bugünün yemek hizmetini değerlendirebilirsiniz."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    {/* Existing Evaluation Display */}
                    {hasExistingEvaluation && !isEditing && (
                        <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', marginBottom: 24 }}>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <Text type="secondary">Değerlendirmeniz</Text>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Rate disabled value={userRating} style={{ fontSize: 32 }} />
                                <div style={{ marginTop: 8 }}>
                                    <Text strong style={{ fontSize: 16 }}>{getRatingDesc(userRating)}</Text>
                                </div>
                            </div>
                            {existingComment && (
                                <div style={{ marginTop: 16, padding: 12, background: '#fff', borderRadius: 4 }}>
                                    <Text type="secondary">Yorumunuz:</Text>
                                    <div style={{ marginTop: 8 }}>{existingComment.comment}</div>
                                </div>
                            )}
                            {canEvaluate && (
                                <Space style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                                    <Button icon={<EditOutlined />} onClick={handleStartEdit}>
                                        Düzenle
                                    </Button>
                                    <Popconfirm
                                        title="Değerlendirmeyi sil"
                                        description="Gün değerlendirmenizi silmek istediğinize emin misiniz?"
                                        onConfirm={handleDelete}
                                        okText="Evet"
                                        cancelText="Hayır"
                                    >
                                        <Button danger icon={<DeleteOutlined />} loading={submitting}>
                                            Sil
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            )}
                        </div>
                    )}

                    {/* Evaluation Form */}
                    {showForm && (
                        <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <Text strong>Bugünkü yemek hizmetini değerlendirin</Text>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <Rate
                                    value={userRating}
                                    onChange={handleRatingChange}
                                    style={{ fontSize: 36 }}
                                    tooltips={Object.values(RATING_DESCRIPTIONS)}
                                />
                                {userRating > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong style={{ fontSize: 16 }}>{getRatingDesc(userRating)}</Text>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <Text>Yorumunuz (isteğe bağlı):</Text>
                                <TextArea
                                    value={userComment}
                                    onChange={handleCommentChange}
                                    placeholder="Bugünkü yemek hizmeti hakkında düşüncelerinizi yazın..."
                                    rows={4}
                                    maxLength={500}
                                    showCount
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            <Space style={{ width: '100%', justifyContent: 'center' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    disabled={userRating === 0}
                                >
                                    {hasExistingEvaluation ? 'Güncelle' : 'Değerlendir'}
                                </Button>
                                {isEditing && (
                                    <Button size="large" onClick={handleCancelEdit}>
                                        İptal
                                    </Button>
                                )}
                            </Space>
                        </div>
                    )}

                    {/* No evaluation and can't evaluate */}
                    {!hasExistingEvaluation && !canEvaluate && (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                            <Text type="secondary">Bu gün için değerlendirme yapılmamış</Text>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default DayEvaluationModal;