// LoginPage.jsx – Trang đăng nhập hệ thống
// - Gọi API login
// - Lưu accessToken & refreshToken
// - Điều hướng Dashboard
// - UI/UX chuẩn Ant Design theo Rule 27
// - Không bọc AdminLayout theo Rule 14

import { useState } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm xử lý đăng nhập
  const onFinish = async (values) => {
    try {
      setLoading(true);

      const res = await login(values); // Gọi API login

      // Lưu token vào localStorage
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);

      message.success("Đăng nhập thành công");

      navigate("/dashboard"); // Điều hướng Dashboard
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      //message.error("Tên đăng nhập hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#f0f2f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        style={{ width: 380, padding: 20, borderRadius: 12 }}
        variant="borderless"  // ✅ Rule 29 – chuẩn Ant Design
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 30 }}>
          Đăng nhập hệ thống
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input placeholder="Nhập tên đăng nhập" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ marginTop: 10 }}
          >
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
