import React from 'react';
import { SkeletonBlock } from '../../../components/common/SkeletonBlock';

interface EvidenceTableSkeletonProps {
  rowCount?: number;
}

export const EvidenceTableSkeleton: React.FC<EvidenceTableSkeletonProps> = ({ rowCount = 8 }) => {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, idx) => (
        <tr key={idx} className="border-b border-[#eef2f6]">
          {/* 1. Checkbox */}
          <td className="py-3 px-3 text-center align-middle">
            <SkeletonBlock className="h-3.5 w-3.5 rounded mx-auto" />
          </td>

          {/* 2. STT */}
          <td className="py-3 px-2 text-center align-middle">
            <SkeletonBlock className="h-3.5 w-6 rounded mx-auto" />
          </td>

          {/* 3. Sinh viên */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-4 w-36 rounded" />
          </td>

          {/* 4. Mã SV */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-3.5 w-20 rounded" />
          </td>

          {/* 5. Email */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-3.5 w-44 rounded" />
          </td>

          {/* 6. Lớp */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-3.5 w-20 rounded" />
          </td>

          {/* 7. Khoa */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-3.5 w-32 rounded" />
          </td>

          {/* 8. Chiến dịch */}
          <td className="py-3 px-3 align-middle">
            <SkeletonBlock className="h-4 w-40 rounded" />
          </td>

          {/* 9. Tiêu chuẩn */}
          <td className="py-3 px-3 align-middle">
            <div className="flex items-center gap-1.5">
              <SkeletonBlock className="h-3.5 w-18 rounded" />
              <SkeletonBlock className="h-3.5 w-20 rounded" />
            </div>
          </td>

          {/* 10. Minh chứng */}
          <td className="py-3 px-3 text-center align-middle">
            <SkeletonBlock className="h-3.5 w-20 rounded mx-auto" />
          </td>

          {/* 11. Thời gian */}
          <td className="py-3 px-3 text-center align-middle">
            <SkeletonBlock className="h-3.5 w-16 rounded mx-auto" />
          </td>

          {/* 12. Quá hạn */}
          <td className="py-3 px-3 text-center align-middle">
            <SkeletonBlock className="h-4 w-20 rounded mx-auto" />
          </td>

          {/* 13. Thao tác */}
          <td className="py-3 px-3 text-center align-middle">
            <SkeletonBlock className="h-7 w-14 rounded-lg mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};
