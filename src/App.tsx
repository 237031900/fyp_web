import "./reset.css";
import { Space, FloatButton, Layout, Menu, Flex } from "antd";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Copyright from "./components/Copyright";
import { DownCircleOutlined, TikTokOutlined } from "@ant-design/icons";
import UploadAudio from "./components/UploadAudio";

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <Flex vertical style={{ minHeight: "100vh", backgroundColor: "#ddd4c5" }}>
        <Header
          style={{
            display: "flex",
            backgroundColor: "#f1ad1c",
            padding: 24,
            height: "auto",
          }}
        >
          <TikTokOutlined
            rotate={20}
            style={{ fontSize: 50, color: "white" }}
          />
        </Header>

        <Content
          style={{
            padding: 24,
          }}
        >
          <UploadAudio />
          <FloatButton.BackTop />
        </Content>
        <Footer
          style={{
            backgroundColor: "#86bd8c",
            padding: "12px 24px",
          }}
        >
          <Copyright />
        </Footer>
      </Flex>
    </Router>
  );
}

export default App;
