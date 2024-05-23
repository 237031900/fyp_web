import { Typography } from "antd";

const { Title, Text } = Typography;

const Copyright = () => {
  return (
    <>
      <Title style={{ color: "#015001" }} level={5}>
        Music Cover
      </Title>
      <Text type="secondary">(c) 2024 Develop by 237031900</Text>
    </>
  );
};

export default Copyright;
