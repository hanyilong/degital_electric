import { Component, State, Prop, Listen, h, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'custom-group',
  styleUrl: 'custom-group.css',
  shadow: true,
})
export class CustomGroup {
  @Prop() groupId: string = 'default';
  @Prop() groupData: any[] = []; // 接收父组件传递的数据
  @State() isExpanded: boolean = false;
  @State() isLoading: boolean = false;

  // 定义自定义事件：供父组件监听
  @Event({ bubbles: true, composed: true }) groupExpand: EventEmitter<string>;

  @Listen('click', { target: 'button' })
  handleExpandClick() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      // 派发自定义事件，携带分组ID
      this.groupExpand.emit(this.groupId);
    }
  }

  // 监听父组件传递的groupData变化（可选，用于重置加载状态）
  componentWillUpdate() {
    this.isLoading = this.groupData.length === 0 && this.isExpanded;
  }

  render() {
    return (
      <div class="custom-group">
        <button class="expand-btn">
          {this.isExpanded ? '收起' : '展开'} 分组{this.groupId}
        </button>
        {this.isExpanded && (
          <div class="group-content">
            {this.isLoading ? (
              <p>加载中...</p>
            ) : (
              <ul>
                {this.groupData.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
}