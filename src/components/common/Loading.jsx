import { Spin } from 'antd'

/**
 * Loading - Yükleme göstergesi bileşeni
 *
 * Sayfanın merkezinde Ant Design Spin bileşenini kullanarak
 * bir yükleme animasyonu gösterir. Veri yüklenirken veya
 * asenkron işlemler sırasında kullanıcıya görsel geri bildirim sağlar.
 *
 * @param {string} size - Spinner boyutu ('small', 'default', 'large')
 * @param {string} tip - Yükleme animasyonu altında gösterilecek metin
 * @returns {JSX.Element} Merkezde konumlanmış yükleme bileşeni
 */
const Loading = ({ size = 'default', tip = 'Loading...' }) => {
    return (
        // Flexbox ile tam genişlikte, minimum 200px yüksekliğinde,
        // içeriği yatay ve dikey olarak ortalar
        <div className="flex items-center justify-center min-h-[200px] w-full">
            {/* Ant Design spinner bileşeni */}
            <Spin size={size} tip={tip} />
        </div>
    )
}

export default Loading