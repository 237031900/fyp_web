import {
  CustomerServiceTwoTone,
  DeleteOutlined,
  RadarChartOutlined,
  SunOutlined,
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
  Space,
  Grid,
  Spin,
  Descriptions,
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
  const [classified, setClassified] = useState<>({});
  const [currentAudio, setCurrentAudio] = useState(null);
  const [modelSelected, setModelSelected] = useState({});
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const handleUpload = ({ file }) => {
    setIsUploading(true);
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
      })
      .finally(() => setIsUploading(false));
  };

  const handleRemove = (uid) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[uid];
      return newFiles;
    });
  };

  const props: UploadProps = {
    showUploadList: false,
    accept: "audio/wav",
    maxCount: 5,
    // multiple: true,
    customRequest: handleUpload,
  };

  const handleModelSelect = (id) => {
    const convertedList = [id] in modelSelected ? modelSelected[id] : {};
    const newConvert = _.differenceBy(
      Object.keys(files),
      Object.keys(convertedList)
    );
    if (newConvert.length > 0) {
      setIsConverting(true);
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
          // setOutput((prev) => {
          //   return { ...prev, [uid]: audio };
          // });
          setModelSelected((prev) => {
            return {
              ...prev,
              [id]: prev[id]
                ? [...prev[id], { [uid]: audio }]
                : [{ [uid]: audio }],
            };
          });
        }
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      })
      .finally(() => {
        setIsConverting(false);
      });
  };
  const handleClassify = () => {
    const newClassify = _.differenceBy(
      Object.keys(files),
      Object.keys(classified)
    );
    if (newClassify.length > 0) {
      setIsConverting(true);
      newClassify.map((uid) => {
        classify(uid, files[uid].name, files[uid].path);
      });
    }
  };

  const classify = (uid, name, path) => {
    axios
      .post(
        "http://127.0.0.1:1147/classify",
        {
          audio_path: path,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => {
        if (res.data) {
          const result = _.sortBy(_.toPairs(res.data), ([, value]) => -value);
          setClassified((prev) => {
            return {
              ...prev,
              [uid]: {
                name,
                path,
                result,
              },
            };
          });
        }
      })
      .catch((err) => {
        openNotification("error", "bottomRight", err.message, err.code);
      })
      .finally(() => {
        setIsConverting(false);
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
    <Flex gap={24} vertical style={{ flex: 1 }}>
      {contextHolder}
      <Spin spinning={isConverting} fullscreen />
      <Flex vertical gap={24} style={{ padding: 24 }}>
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

        <Flex gap={8} align="flex-end">
          <Upload {...props}>
            <Button
              icon={<UploadOutlined />}
              loading={isUploading}
              disabled={Object.keys(files).length > 4}
              style={{
                backgroundColor: "#14336F",
                color: "white",
                opacity: Object.keys(files).length > 4 ? 0.5 : 1,
              }}
            >
              Browse
            </Button>
          </Upload>
          {Object.keys(files).length > 4 && (
            <Text code>You’ve reached the limit!</Text>
          )}
        </Flex>
        <Flex wrap gap={24}>
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
                    <Text>{file.name}</Text>
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
        </Flex>
      </Flex>

      <Flex vertical style={{ flex: 1 }}>
        <Spin spinning={Object.keys(files).length < 1} indicator={<Space />}>
          <Flex vertical gap={24} style={{ padding: 24 }}>
            <Flex vertical>
              <Title style={{ color: "#14336F" }}>Select singer</Title>
              <Paragraph>Select a target singer</Paragraph>
            </Flex>
            <Flex wrap="wrap" gap="middle">
              {modelList.map(({ id, name, path }) => (
                <Flex key={id} vertical gap={8}>
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
            {Object.keys(modelSelected).map((file, index) => (
              <Flex key={index} gap={16} align="center">
                <Image
                  width={50}
                  height={50}
                  src={modelList[file].path}
                  preview={false}
                  style={{
                    borderRadius: "8px",
                    border: "solid 2px",
                    borderImage: "linear-gradient(#f6b73c, #4d9f0c) 30",
                  }}
                />
                <Flex wrap gap={8}>
                  {modelSelected[file].map((songs) => {
                    return Object.values(songs).map((song, index) => (
                      <Flex key={index} vertical gap={8}>
                        <Text>{song.name}</Text>
                        <audio
                          controls
                          style={{ width: "250px", height: "40px" }}
                        >
                          <source src={song.path} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </Flex>
                    ));
                  })}
                </Flex>
              </Flex>
            ))}
          </Flex>
          <Flex vertical gap={24} style={{ padding: 24 }}>
            <Flex vertical>
              <Title style={{ color: "#14336F" }}>Song classification</Title>
              <Paragraph>Know your type</Paragraph>
            </Flex>
            <Button
              icon={<RadarChartOutlined />}
              loading={isUploading}
              disabled={Object.keys(files).length > 4}
              style={{
                backgroundColor: "#14336F",
                color: "white",
                opacity: Object.keys(files).length > 4 ? 0.5 : 1,
              }}
              onClick={handleClassify}
            >
              Get your music type!
            </Button>
            <Flex vertical gap={8}>
              {Object.values(classified).map((data, index) => (
                <Flex gap={8} key={index} vertical>
                  <Text>{data.name}</Text>
                  {data.result.map((number, index) => (
                    <Flex gap={8} key={index}>
                      <Paragraph
                        strong={index === 0}
                        italic={index === 0}
                        style={{ width: "70px", textTransform: "capitalize" }}
                      >
                        {number[0]}
                      </Paragraph>
                      <Progress
                        percent={Math.ceil(number[1] * 100)}
                        size={[250, 6]}
                      />
                    </Flex>
                  ))}
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Spin>
      </Flex>
    </Flex>
  );
};

export default UploadAudio;
