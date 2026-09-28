using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStandardTitlesAndDescriptionsWithAccents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE standards 
                SET Title = 'Đạo đức tốt', 
                    Description = 'Đánh giá về tư tưởng chính trị, đạo đức, lối sống và ý thức chấp hành pháp luật, nội quy nhà trường.' 
                WHERE (Code = 'TC_DAODUC' OR GroupCode = 1) AND (Title = 'Dao duc tot' OR Title = 'TC_DAODUC');

                UPDATE standards 
                SET Title = 'Học tập tốt', 
                    Description = 'Đánh giá về kết quả học tập, nghiên cứu khoa học và tinh thần học hỏi sáng tạo.' 
                WHERE (Code = 'TC_HOCTAP' OR GroupCode = 2) AND (Title = 'Hoc tap tot' OR Title = 'TC_HOCTAP');

                UPDATE standards 
                SET Title = 'Thể lực tốt', 
                    Description = 'Đánh giá về rèn luyện thể chất, thể dục thể thao và chứng nhận thể lực.' 
                WHERE (Code = 'TC_THELUC' OR GroupCode = 3) AND (Title = 'The luc tot' OR Title = 'TC_THELUC');

                UPDATE standards 
                SET Title = 'Tình nguyện tốt', 
                    Description = 'Đánh giá về việc tham gia các hoạt động tình nguyện vì cộng đồng, an sinh xã hội.' 
                WHERE (Code = 'TC_TINHNGUYEN' OR GroupCode = 4) AND (Title = 'Tinh nguyen tot' OR Title = 'TC_TINHNGUYEN');

                UPDATE standards 
                SET Title = 'Hội nhập tốt', 
                    Description = 'Đánh giá về trình độ ngoại ngữ, kỹ năng mềm và các hoạt động giao lưu quốc tế.' 
                WHERE (Code = 'TC_HOINHAP' OR GroupCode = 5) AND (Title = 'Hoi nhap tot' OR Title = 'TC_HOINHAP');

                UPDATE standards SET Title = 'Đạo đức tốt' WHERE Title = 'Dao duc tot';
                UPDATE standards SET Title = 'Học tập tốt' WHERE Title = 'Hoc tap tot';
                UPDATE standards SET Title = 'Thể lực tốt' WHERE Title = 'The luc tot';
                UPDATE standards SET Title = 'Tình nguyện tốt' WHERE Title = 'Tinh nguyen tot';
                UPDATE standards SET Title = 'Hội nhập tốt' WHERE Title = 'Hoi nhap tot';
                UPDATE standards SET Description = 'Đánh giá về tư tưởng chính trị, đạo đức, lối sống và ý thức chấp hành pháp luật, nội quy nhà trường.' WHERE Description LIKE '%Danh gia ve tu tuong%';
                UPDATE standards SET Description = 'Đánh giá về kết quả học tập, nghiên cứu khoa học và tinh thần học hỏi sáng tạo.' WHERE Description LIKE '%Danh gia ve ket qua hoc tap%';
                UPDATE standards SET Description = 'Đánh giá về rèn luyện thể chất, thể dục thể thao và chứng nhận thể lực.' WHERE Description LIKE '%Danh gia ve ren luyen the chat%';
                UPDATE standards SET Description = 'Đánh giá về việc tham gia các hoạt động tình nguyện vì cộng đồng, an sinh xã hội.' WHERE Description LIKE '%Danh gia ve viec tham gia%';
                UPDATE standards SET Description = 'Đánh giá về trình độ ngoại ngữ, kỹ năng mềm và các hoạt động giao lưu quốc tế.' WHERE Description LIKE '%Danh gia ve trinh do ngoai ngu%';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
