import {
  CustomerServiceTwoTone,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Progress,
  Image,
  Typography,
  Upload,
  UploadProps,
  notification,
} from "antd";
import _ from "lodash";
import axios from "axios";
import { useEffect, useState } from "react";
import { api } from "../common/http-common";

import type { NotificationArgsProps } from "antd";

type NotificationPlacement = NotificationArgsProps["placement"];
type NotificationType = "success" | "info" | "warning" | "error";
type TFile = {
  name?: string;
  uid?: string;
  progress?: number;
  path?: string;
};

import Anita from "../assets/image/anita.jpg";
import Jacky from "../assets/image/jacky.jpg";
const modelList = [
  {
    id: 0,
    name: "Jacky",
    path: Jacky,
  },
  {
    id: 1,
    name: "Anita",
    path: Anita,
  },
];

const { Title, Paragraph, Text } = Typography;

const UploadAudio = () => {
  const [noticeApi, contextHolder] = notification.useNotification();
  const [files, setFiles] = useState<TFile>({});
  const [output, setOutput] = useState({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [modelSelect, setModelSelect] = useState();
  const handleUpload = ({ file }) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>", file);
    const getFileObject = (progress) => {
      return {
        name: file.name,
        uid: file.uid,
        progress,
      };
    };
    axios
      .post(
        `${api.uri}/upload`,
        { file },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            let blobUrl = URL.createObjectURL(file);
            const newFileObj = {
              ...getFileObject(event.progress),
              blob: blobUrl,
            };
            setFiles((prev) => {
              return { ...prev, [file.uid]: newFileObj };
            });
          },
        }
      )
      .then(({ data }) => {
        const path = data.path;
        setFiles((prev) => {
          return {
            ...prev,
            [file.uid]: {
              ...prev[file.uid],
              path,
            },
          };
        });
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      });
  };

  const handleRemove = (uid) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[uid];
      return newFiles;
    });
  };
  useEffect(() => {
    console.log(files);
  }, [files]);

  const props: UploadProps = {
    showUploadList: false,
    accept: "audio/wav",
    maxCount: 5,
    // multiple: true,
    customRequest: handleUpload,
  };

  const handleModelSelect = (id) => {
    const newConvert = _.differenceBy(Object.keys(files), Object.keys(output));
    if (newConvert.length > 0) {
      newConvert.map((uid) => {
        convert(id, uid, files[uid].name, files[uid].path);
      });
    }
  };
  const convert = (id, uid, name, path) => {
    axios
      .post(
        "http://127.0.0.1:1145/wav2wav",
        {
          spk: id,
          audio_name: name,
          audio_path: path,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      )
      .then((res) => {
        if (res.data) {
          const path = URL.createObjectURL(res.data);
          const audio = {
            name,
            path,
          };
          setOutput((prev) => {
            return { ...prev, [uid]: audio };
          });
        }
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      });
  };

  const openNotification = (
    type: NotificationType,
    placement: NotificationPlacement,
    title: string,
    message: string
  ) => {
    noticeApi[type]({
      message: title,
      description: message,
      placement,
      duration: 5,
    });
  };

  const handlePlay = (tar) => {
    console.log("?????", tar);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    // const audio = new Audio(target);
    // console.log(audio)
    // audio.play();
    // audio.pause();
    // setCurrentAudio(audio);
  };

  return (
    <Flex gap={24} vertical>
      {contextHolder}
      {modelSelect}
      <Flex vertical>
        <Title style={{ color: "#14336F" }}>Upload songs</Title>
        <Paragraph>
          upload up to{" "}
          <Text strong italic>
            five
          </Text>{" "}
          songs to start
        </Paragraph>
      </Flex>

      <Flex gap={32} align="flex-end">
        <Upload {...props}>
          <Button
            icon={<UploadOutlined />}
            disabled={Object.keys(files).length > 4}
            style={{ backgroundColor: "#14336F", color: "white" }}
          >
            Browse
          </Button>
        </Upload>
        {Object.keys(files).length > 4 && (
          <Text code>You’ve reached the limit!</Text>
        )}
      </Flex>
      <Flex wrap gap={24} justify="space-between">
        {Object.values(files).map((file, index) => {
          return (
            <Flex
              key={index}
              vertical
              gap={12}
              align="center"
              style={{
                boxShadow: "rgb(196 191 182) 8px 8px 20px 0px",
                backgroundColor: "rgba(0,0,0,0.05)",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Flex
                gap={8}
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Progress
                  type="circle"
                  size={21}
                  percent={Math.ceil(file.progress * 100)}
                />
                <Flex gap={8} align="center">
                  <CustomerServiceTwoTone twoToneColor="#14336F" />
                  <text style={{ fontFamily: "monospace" }}>{file.name}</text>
                  <DeleteOutlined
                    onClick={() => handleRemove(file.uid)}
                    style={{ flexShrink: 0 }}
                  />
                </Flex>
              </Flex>

              <audio controls onPlay={handlePlay}>
                <source src={file.blob} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </Flex>
          );
        })}

        <Flex vertical gap={24}>
          <Flex vertical>
            <Title style={{ color: "#14336F" }}>Select singer</Title>
            <Paragraph>Select a target singer</Paragraph>
          </Flex>
          <Flex wrap="wrap" gap="middle">
            {modelList.map(({ id, name, path }) => (
              <Flex key={id} vertical gap={8}>
                {modelSelect}
                {id}
                <Text italic strong>
                  {name}
                </Text>
                <Image
                  width={200}
                  height={200}
                  src={path}
                  preview={false}
                  onClick={() => handleModelSelect(id)}
                  style={{
                    borderRadius: "8px",
                    border: "solid 2px",
                    borderImage: "linear-gradient(#f6b73c, #4d9f0c) 30",
                    cursor: "pointer",
                  }}
                />
              </Flex>
            ))}
          </Flex>
          {Object.values(output).map((file, index) => (
            <Flex key={index} vertical gap={8}>
              <text style={{ fontFamily: "monospace" }}>{file.name}</text>
              <audio controls onPlay={handlePlay}>
                <source src={file.path} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default UploadAudio;
