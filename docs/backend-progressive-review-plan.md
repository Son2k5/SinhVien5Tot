# Kế hoạch backend: nộp minh chứng từng phần và chốt hồ sơ chiến dịch

## Phạm vi triển khai

Hồ sơ chiến dịch hiện là nơi lưu minh chứng của sinh viên. Mỗi minh chứng có vòng đời riêng; trạng thái `Draft` của hồ sơ tổng không chặn mentor/admin xét minh chứng đã nộp. Việc chốt hồ sơ tổng là một thao tác riêng trong thời gian chiến dịch nhận hồ sơ. Các API hiện có vẫn giữ đường dẫn và kiểu phản hồi để frontend có thể chuyển dần sang luồng mới.

## Luồng nghiệp vụ

1. Sinh viên tạo hồ sơ nháp cho chiến dịch đang mở, lưu nội dung hoặc tệp vào từng tiêu chí.
2. Sinh viên gọi `POST /api/student/evidences/{id}/submit` với `rowVersion` để chuyển riêng minh chứng đó từ `Draft` sang `Submitted`. Một minh chứng rỗng không được nộp. Thao tác ghi nhật ký `EvidenceSubmitted`.
3. Mentor/admin dùng `GET /api/admin/evidences?status=Submitted` và `POST /api/admin/evidences/{id}/review` (hoặc API xét minh chứng trong chi tiết sinh viên) để duyệt, yêu cầu sửa hoặc từ chối. Kết quả không làm hồ sơ nháp tự chuyển thành hồ sơ đã nộp.
4. Sinh viên sửa minh chứng bị yêu cầu bổ sung hoặc từ chối, rồi nộp lại riêng minh chứng đó. Các minh chứng đã duyệt không bị ảnh hưởng.
5. Khi chiến dịch đang mở nhận hồ sơ, sinh viên gọi `POST /api/student/applications/{id}/submit`. Tất cả tiêu chí bắt buộc phải có minh chứng ở trạng thái `Submitted` hoặc `Approved`. Thao tác ghi `SubmittedAt`; việc nộp lại giữ mốc nộp đầu tiên.
6. Mentor/admin dùng `GET /api/admin/applications` và `GET /api/admin/applications/{id}` để xem hồ sơ đã nộp cùng tiến độ 5 nhóm; dùng `POST /api/admin/applications/{id}/decision` để quyết định `Approved`, `Rejected` hoặc `NeedsRevision`. Phê duyệt chỉ khi đủ cả 5 nhóm; từ chối/yêu cầu sửa cần ghi chú.

## Quyền và đồng thời

- Các API ghi dữ liệu của sinh viên yêu cầu vai trò `User` và tra cứu theo chủ hồ sơ.
- Các API xét minh chứng và hồ sơ tổng yêu cầu vai trò `Admin` hoặc `Mentor`.
- Thao tác nộp/xét duyệt dùng `rowVersion`; lỗi cạnh tranh trả `409`.
- Nhật ký xét duyệt được ghi cùng giao dịch với thay đổi trạng thái.

## Giới hạn của mô hình dữ liệu hiện tại

Minh chứng đang có khóa ngoại bắt buộc tới hồ sơ chiến dịch. Do đó giai đoạn này sinh viên chuẩn bị và nộp dần sau khi chiến dịch đã mở và hồ sơ nháp đã được tạo. Một kho minh chứng tồn tại trước khi có chiến dịch sẽ cần bảng dữ liệu riêng, chính sách gắn minh chứng sang bộ tiêu chuẩn của từng năm và quy tắc phiên bản khi tái sử dụng. Phần đó cần được thiết kế như đợt backend tiếp theo trước khi cho phép tích lũy minh chứng hoàn toàn độc lập chiến dịch.

## Tích hợp frontend sau backend

- Thêm nút nộp cho từng minh chứng và hiển thị kết quả mentor theo trạng thái minh chứng.
- Chỉ bật nút nộp hồ sơ tổng khi chiến dịch mở và các tiêu chí bắt buộc đã được nộp riêng.
- Dùng bảng hồ sơ tổng mới cho admin/mentor, hiển thị 5 nhóm và quyết định cuối cùng.
