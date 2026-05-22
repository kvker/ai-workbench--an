# 原始输入

```text
1. 先了解我们现在的自动分支生成方案,此生成方法需要保留,但不关联分支.
2. 生成分支请走接口的"创建发布计划"来处理

发布计划信息如下:

已定位到主入口是 DeployPlanController，里面同时包含新增、列
  表、详情和进度查询。我再读取相关方法与请求 VO，补齐请求参数字
  段。

• Explored
  └ Read DeployPlanController.java
    List req
    Search DeployPlan.*Req|DeployPlan.*VO
    Read AiWorkspaceController.java, IssueController.java

• Ran for f in /home/dhf/projects/devops-service/
  │ devops-interfaces/src/main/java/com/dahuangf/devops/
  │ interfaces/vo/req/DeployPlanAddReqVO.java /home/dhf/
  │ … +9 lines
  └
    ### /home/dhf/projects/devops-service/devops-interfaces/src/
    … +140 lines (ctrl + t to view transcript)
        }
    }

• Explored
  └ Read AiWorkspaceController.java, IssueController.java

────────────────────────────────────────────────────────────────

• 我还会取一下行号，便于你直接跳转到接口定义位置。

• Explored
  └ Read DeployPlanController.java, DeployPlanAddReqVO.java,
         AiWorkspaceController.java, IssueController.java

────────────────────────────────────────────────────────────────

• 找到的“创建发布计划”主接口在：

  /home/dhf/projects/devops-service/devops-interfaces/src/main/
  java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:43

  创建发布计划
  POST /deployPlan/add

  方法位置：/home/dhf/projects/devops-service/devops-interfaces/
  src/main/java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:54

  请求体 DeployPlanAddReqVO 字段：

  {
    "issueId": 1,
    "projectConfigId": 1,
    "branchName": "feature/xxx",
    "planDeployDate": "2026-05-22",
    "reviewUser": "reviewUserName",
    "testUser": "testUserName",
    "remark": "备注"
  }

  其中 planDeployDate/reviewUser/testUser/remark 来自基类
  DeployPlanReqBaseVO。

  查询发布计划列表
  GET /deployPlan/list

  方法位置：/home/dhf/projects/devops-service/devops-interfaces/
  src/main/java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:106

  查询参数 DeployPlanPageReqVO：

  projectConfigId
  issueId
  planDeployDate
  statusList
  testStatus
  reviewStatus
  userType    // 1-处理人 2-审核人 3-测试人

  分页查询发布计划
  GET /deployPlan/listPage

  方法位置：/home/dhf/projects/devops-service/devops-interfaces/
  src/main/java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:164

  参数同 DeployPlanPageReqVO，另外继承分页参数 PageParam。

  查询发布计划详情
  GET /deployPlan/detail?deployPlanId=xxx

  方法位置：/home/dhf/projects/devops-service/devops-interfaces/
  src/main/java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:311

  查询发布计划进度
  GET /deployPlan/queryProgress?deployPlanId=xxx

  方法位置：/home/dhf/projects/devops-service/devops-interfaces/
  src/main/java/com/dahuangf/devops/interfaces/controller/
  DeployPlanController.java:319

  另外还有两个相关查询：

  GET /ai/workspace/deployPlans?issueId=xxx：按 IssueId 获取简化
  发布计划列表，位置 /home/dhf/projects/devops-service/devops-
  interfaces/src/main/java/com/dahuangf/devops/interfaces/
  controller/ai/AiWorkspaceController.java:102

  GET /issue/integrationPlanDocGet?issueId=xxx：查看 Issue 上保
  存的“发布计划文档”，位置 /home/dhf/projects/devops-service/
  devops-interfaces/src/main/java/com/dahuangf/devops/
  interfaces/controller/IssueController.java:346

实体文件在: /home/dhf/projects/devops-service/devops-interfaces/src/main/
  java/com/dahuangf/devops/interfaces/controller 下面

---

现在我说一下功能

1. 详情页的信息区需要一个按钮触发弹框,按钮"发布计划"
2. 点击发布计划,显示发布计划列表,竖向排列,卡片横向:工程名,分支
3. 发布计划弹框下面可以点击加号添加新的发布计划,就是显示一个选择框,选择未选中的工程
4. 获取发布计划的列表查询 frontend 的
5. 其他见具体接口.

对了,获取详情页时候,多一步获取相关发布计划的列表信息.
```

## 补充输入

```text
补充一下,发布计划获取成功后,需要在 repos 里面根据发布计划的列表项中对应的仓库对应的分支 clone 下来. 若已有则进去 pull --rebase 更新, 若没有则 clone
```
